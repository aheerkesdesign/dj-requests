import React, { useState, useEffect } from 'react';
import {
  Track,
  TrackFieldVisibility,
  DEFAULT_TRACK_FIELD_VISIBILITY,
  type RequestButtonStyle,
} from '../types';
import { Plus, PlusCircle, Check } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { CamelotBadge } from './CamelotBadge';
import { BpmBadge } from './BpmBadge';
import { errorMessage } from '../utils/errors';
import { hasPresentMetaValue } from '../utils/library';
import { cn } from '@/lib/utils';

interface TrackCardProps {
  track: Track;
  searchHighlight?: string;
  isAlreadyRequested?: boolean;
  onRequestSimilar?: (artist: string, title: string) => Promise<void> | void;
  visibleFields?: TrackFieldVisibility;
  requestButtonStyle?: RequestButtonStyle;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  searchHighlight = '',
  isAlreadyRequested = false,
  onRequestSimilar,
  visibleFields = DEFAULT_TRACK_FIELD_VISIBILITY,
  requestButtonStyle = 'text',
}) => {
  const { t } = useI18n();
  const [requestedLocally, setRequestedLocally] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPulse, setConfirmPulse] = useState(false);

  useEffect(() => {
    if (!isAlreadyRequested) {
      setRequestedLocally(false);
    }
  }, [isAlreadyRequested]);

  const isRequested = isAlreadyRequested || requestedLocally;
  const iconOnly = requestButtonStyle === 'icon';

  const handleRequest = async () => {
    if (isRequested || isLoading || !onRequestSimilar) return;
    setRequestedLocally(true);
    setConfirmPulse(true);
    setIsLoading(true);
    try {
      await onRequestSimilar(track.artist, track.name);
    } catch (err: unknown) {
      setRequestedLocally(false);
      setConfirmPulse(false);
      alert(errorMessage(err, t('trackCard.requestError')));
    } finally {
      setIsLoading(false);
    }
  };

  const highlightText = (text: string) => {
    if (!searchHighlight || !searchHighlight.trim()) return text;
    const parts = text.split(new RegExp(`(${searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchHighlight.toLowerCase() ? (
        <mark key={i} className="rounded bg-primary/30 px-0.5 font-semibold text-primary">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const showAlbum = visibleFields.album && hasPresentMetaValue(track.album);
  const showBpm = visibleFields.bpm && hasPresentMetaValue(track.bpm);
  const showKey = visibleFields.key && hasPresentMetaValue(track.key) && track.key !== 'N/A';
  const showGenre = visibleFields.genre && hasPresentMetaValue(track.genre);
  const showDuration = visibleFields.duration && hasPresentMetaValue(track.duration);
  const showYear = visibleFields.year && hasPresentMetaValue(track.year);
  const showMeta = showAlbum || showBpm || showKey || showGenre || showDuration || showYear;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 motion-colors hover:border-secondary">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold leading-snug tracking-tight text-foreground">
          {highlightText(track.name)}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {highlightText(track.artist)}
        </p>
        {showMeta && (
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {showAlbum && (
              <span className="max-w-full truncate text-xs text-muted-foreground/70">
                {highlightText(track.album!)}
              </span>
            )}
            {showAlbum && (showBpm || showKey) && (
              <span className="text-xs text-muted-foreground/40" aria-hidden>
                ·
              </span>
            )}
            {showBpm && <BpmBadge bpm={track.bpm} size="sm" />}
            {showBpm && showKey && (
              <span className="text-xs text-muted-foreground/40" aria-hidden>
                ·
              </span>
            )}
            {showKey && <CamelotBadge keyString={track.key} size="sm" />}
            {(showBpm || showKey) && (showGenre || showDuration || showYear) && (
              <span className="text-xs text-muted-foreground/40" aria-hidden>
                ·
              </span>
            )}
            {showGenre && (
              <span className="max-w-full truncate text-xs text-muted-foreground/70">
                {track.genre}
              </span>
            )}
            {showGenre && (showDuration || showYear) && (
              <span className="text-xs text-muted-foreground/40" aria-hidden>
                ·
              </span>
            )}
            {showDuration && (
              <span className="font-heading text-xs tabular-nums text-muted-foreground">
                {track.durationFormatted}
              </span>
            )}
            {showDuration && showYear && (
              <span className="text-xs text-muted-foreground/40" aria-hidden>
                ·
              </span>
            )}
            {showYear && (
              <span className="text-xs text-muted-foreground/70">{track.year}</span>
            )}
          </div>
        )}
      </div>

      {onRequestSimilar && (
        <button
          type="button"
          onClick={handleRequest}
          disabled={isRequested || isLoading}
          onAnimationEnd={() => setConfirmPulse(false)}
          aria-label={isRequested ? t('trackCard.requested') : t('trackCard.requestTitle')}
          title={isRequested ? t('trackCard.requested') : t('trackCard.requestTitle')}
          className={cn(
            'relative grid shrink-0 place-items-center overflow-hidden motion-colors',
            iconOnly
              ? 'size-11 rounded-xl'
              : 'rounded-full px-3.5 py-1.5 text-xs font-semibold',
            isRequested
              ? 'cursor-default border border-border bg-secondary text-muted-foreground'
              : 'border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20',
            confirmPulse && 'motion-request-confirm'
          )}
        >
          {iconOnly ? (
            <>
              <Plus
                aria-hidden
                className={cn(
                  'col-start-1 row-start-1 h-6 w-6 transition-[opacity,transform] duration-200 ease-out',
                  isRequested
                    ? 'pointer-events-none scale-75 opacity-0'
                    : 'scale-100 opacity-100'
                )}
              />
              <Check
                aria-hidden
                className={cn(
                  'col-start-1 row-start-1 h-6 w-6 transition-[opacity,transform] duration-200 ease-out',
                  isRequested
                    ? 'scale-100 opacity-100'
                    : 'pointer-events-none scale-75 opacity-0'
                )}
              />
            </>
          ) : (
            <>
              <span
                aria-hidden={isRequested}
                className={cn(
                  'col-start-1 row-start-1 flex items-center gap-1.5 whitespace-nowrap transition-[opacity,transform] duration-200 ease-out',
                  isRequested
                    ? 'pointer-events-none scale-95 opacity-0'
                    : 'scale-100 opacity-100'
                )}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>{t('trackCard.request')}</span>
              </span>
              <span
                aria-hidden={!isRequested}
                className={cn(
                  'col-start-1 row-start-1 flex items-center gap-1.5 whitespace-nowrap transition-[opacity,transform] duration-200 ease-out',
                  isRequested
                    ? 'scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                )}
              >
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{t('trackCard.requested')}</span>
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
