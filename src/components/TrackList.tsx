import React from 'react';
import { Track, TrackRequest } from '../types';
import { TrackCard } from './TrackCard';
import { SearchX, PlusCircle } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

interface TrackListProps {
  tracks: Track[];
  searchQuery: string;
  requests?: TrackRequest[];
  isOwner?: boolean;
  onRequestModalOpen: () => void;
  onRequestSimilar: (artist: string, title: string) => Promise<void> | void;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  searchQuery,
  requests = [],
  isOwner = false,
  onRequestModalOpen,
  onRequestSimilar
}) => {
  const { t } = useI18n();
  // Mobile Pagination / Infinite Chunk rendering for smooth performance with large XML libraries
  const [visibleCount, setVisibleCount] = React.useState(50);

  // Reset pagination when search query or filter changes
  React.useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, tracks.length]);

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

  const displayedTracks = tracks.slice(0, visibleCount);
  const hasMore = visibleCount < tracks.length;

  if (tracks.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 text-center my-4 space-y-3 shadow-inner">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-cyan-400 mx-auto flex items-center justify-center border border-zinc-700/60">
          <SearchX className="w-8 h-8" />
        </div>

        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-zinc-100">
            {searchQuery
              ? t('tracks.noneForQuery', { query: searchQuery })
              : t('tracks.noneInSelection')}
          </h3>
          {!isOwner && (
            <p className="text-xs text-zinc-400">
              {t('tracks.notOnUsb')}
            </p>
          )}
        </div>

        {!isOwner && (
          <div className="pt-2">
            <button
              onClick={onRequestModalOpen}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> {t('tracks.requestThis')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {displayedTracks.map(track => (
        <TrackCard
          key={track.id}
          track={track}
          searchHighlight={searchQuery}
          isAlreadyRequested={isTrackRequested(track)}
          onRequestSimilar={onRequestSimilar}
        />
      ))}

      {/* Show More Button if list is large */}
      {hasMore && (
        <div className="pt-3 text-center">
          <button
            onClick={() => setVisibleCount(prev => prev + 50)}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/90 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            {t('tracks.showMore', { shown: visibleCount, total: tracks.length })}
          </button>
        </div>
      )}
    </div>
  );
};
