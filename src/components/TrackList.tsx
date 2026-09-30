import React from 'react';
import { Track, TrackRequest, TrackFieldVisibility, DEFAULT_TRACK_FIELD_VISIBILITY, type RequestButtonStyle } from '../types';
import { TrackCard } from './TrackCard';
import { SearchX, PlusCircle, Disc3, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { useArriveFromEmpty, usePresence } from '../hooks/useMotionPresence';
import { cn } from '@/lib/utils';

interface TrackListProps {
  tracks: Track[];
  searchQuery: string;
  requests?: TrackRequest[];
  isOwner?: boolean;
  /** Missing-track prompts only. In-library request buttons stay available either way. */
  allowDownloadRequests?: boolean;
  visibleFields?: TrackFieldVisibility;
  requestButtonStyle?: RequestButtonStyle;
  totalCount?: number;
  listKey?: string;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onRequestModalOpen: () => void;
  onRequestSimilar: (track: Track) => Promise<void> | void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  searchQuery,
  requests = [],
  isOwner = false,
  allowDownloadRequests = true,
  visibleFields = DEFAULT_TRACK_FIELD_VISIBILITY,
  requestButtonStyle = 'text',
  totalCount,
  listKey = '',
  loading = false,
  loadingMore = false,
  onLoadMore,
  onRequestModalOpen,
  onRequestSimilar
}) => {
  const { t } = useI18n();
  const [visibleCount, setVisibleCount] = React.useState(50);

  const showLoader = loading && tracks.length === 0;
  const { present: loaderPresent, phase: loaderPhase } = usePresence(showLoader);
  const listArriving = useArriveFromEmpty(tracks.length, !loaderPresent);

  React.useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, listKey]);

  const isTrackRequested = (track: Track) => {
    if (!requests || requests.length === 0) return false;
    const tName = track.name.trim().toLowerCase();
    const tArtist = track.artist.trim().toLowerCase();
    return requests.some(r => {
      // Only block playable pending requests
      if (r.status !== 'pending' || r.kind !== 'playable') return false;
      const rTitle = r.title.trim().toLowerCase();
      const rArtist = (r.artist || '').trim().toLowerCase();
      if (rTitle === tName) {
        if (!tArtist || !rArtist) return true;
        return rArtist === tArtist || rArtist.includes(tArtist) || tArtist.includes(rArtist);
      }
      return false;
    });
  };

  const total = totalCount ?? tracks.length;
  const displayedTracks = onLoadMore ? tracks : tracks.slice(0, visibleCount);
  const hasMore = onLoadMore ? tracks.length < total : visibleCount < tracks.length;

  if (loaderPresent) {
    return (
      <div
        className={cn(
          'flex justify-center py-10',
          loaderPhase === 'enter' && 'motion-fade-in-place',
          loaderPhase === 'exit' && 'motion-panel-exit'
        )}
      >
        <Disc3 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div
        key={listKey}
        className={cn(
          'my-4 space-y-3 rounded-2xl border border-border bg-card/60 p-8 text-center',
          'motion-panel-enter'
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary text-primary">
          <SearchX className="h-8 w-8" />
        </div>

        <div className="mx-auto max-w-md space-y-1">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {searchQuery
              ? t('tracks.noneForQuery', { query: searchQuery })
              : t('tracks.noneInSelection')}
          </h3>
          {!isOwner && allowDownloadRequests && searchQuery.trim() && (
            <p className="text-xs text-muted-foreground">
              {t('tracks.notOnUsb')}
            </p>
          )}
        </div>

        {!isOwner && allowDownloadRequests && searchQuery.trim() && (
          <div className="pt-2">
            <button
              onClick={onRequestModalOpen}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-heading font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" /> {t('tracks.requestThis')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      key={listKey}
      className={cn('space-y-2', listArriving && 'motion-panel-enter')}
    >
      {displayedTracks.map(track => (
        <TrackCard
          key={track.id}
          track={track}
          searchHighlight={searchQuery}
          isAlreadyRequested={isTrackRequested(track)}
          onRequestSimilar={onRequestSimilar}
          visibleFields={visibleFields}
          requestButtonStyle={requestButtonStyle}
        />
      ))}

      {hasMore && (
        <div className="pt-3 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => {
              if (onLoadMore) onLoadMore();
              else setVisibleCount((prev) => prev + 50);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
          >
            {loadingMore
              ? t('common.loading')
              : t('tracks.showMore', {
                  shown: onLoadMore ? tracks.length : Math.min(visibleCount, tracks.length),
                  total,
                })}
            {!loadingMore && <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
