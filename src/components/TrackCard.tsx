import React, { useState, useEffect } from 'react';
import { Track, TrackFieldVisibility, DEFAULT_TRACK_FIELD_VISIBILITY } from '../types';
import { PlusCircle, Check } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { CamelotBadge } from './CamelotBadge';
import { BpmBadge } from './BpmBadge';
import { errorMessage } from '../utils/errors';

interface TrackCardProps {
  track: Track;
  searchHighlight?: string;
  isAlreadyRequested?: boolean;
  onRequestSimilar?: (artist: string, title: string) => Promise<void> | void;
  visibleFields?: TrackFieldVisibility;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  searchHighlight = '',
  isAlreadyRequested = false,
  onRequestSimilar,
  visibleFields = DEFAULT_TRACK_FIELD_VISIBILITY,
}) => {
  const { t } = useI18n();
  const [requestedLocally, setRequestedLocally] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAlreadyRequested) {
      setRequestedLocally(false);
    }
  }, [isAlreadyRequested]);

  const isRequested = isAlreadyRequested || requestedLocally;

  const handleRequest = async () => {
    if (isRequested || isLoading || !onRequestSimilar) return;
    setRequestedLocally(true);
    setIsLoading(true);
    try {
      await onRequestSimilar(track.artist, track.name);
    } catch (err: unknown) {
      setRequestedLocally(false);
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
        <mark key={i} className="bg-emerald-500/30 text-emerald-200 font-semibold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const showAlbum = visibleFields.album && Boolean(track.album);
  const showBpm = visibleFields.bpm && Boolean(track.bpm);
  const showKey = visibleFields.key && Boolean(track.key);
  const showGenre = visibleFields.genre && Boolean(track.genre);
  const showDuration = visibleFields.duration && Boolean(track.durationFormatted);
  const showYear = visibleFields.year && Boolean(track.year);
  const showMeta = showAlbum || showBpm || showKey || showGenre || showDuration || showYear;

  return (
    <div className="bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-between gap-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-zinc-100 truncate leading-snug">
          {highlightText(track.name)}
        </h3>
        <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
          {highlightText(track.artist)}
        </p>
        {showMeta && (
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 min-w-0">
            {showAlbum && (
              <span className="text-xs text-zinc-500 truncate max-w-full">
                {highlightText(track.album!)}
              </span>
            )}
            {showAlbum && (showBpm || showKey) && (
              <span className="text-zinc-700 text-xs" aria-hidden>
                ·
              </span>
            )}
            {showBpm && <BpmBadge bpm={track.bpm} size="sm" />}
            {showBpm && showKey && (
              <span className="text-zinc-700 text-xs" aria-hidden>
                ·
              </span>
            )}
            {showKey && <CamelotBadge keyString={track.key} size="sm" />}
            {(showBpm || showKey) && (showGenre || showDuration || showYear) && (
              <span className="text-zinc-700 text-xs" aria-hidden>
                ·
              </span>
            )}
            {showGenre && (
              <span className="text-xs text-zinc-500 truncate max-w-full">
                {track.genre}
              </span>
            )}
            {showGenre && (showDuration || showYear) && (
              <span className="text-zinc-700 text-xs" aria-hidden>
                ·
              </span>
            )}
            {showDuration && (
              <span className="text-xs font-mono tabular-nums text-zinc-400">
                {track.durationFormatted}
              </span>
            )}
            {showDuration && showYear && (
              <span className="text-zinc-700 text-xs" aria-hidden>
                ·
              </span>
            )}
            {showYear && (
              <span className="text-xs text-zinc-500">{track.year}</span>
            )}
          </div>
        )}
      </div>

      {onRequestSimilar && (
        <button
          onClick={handleRequest}
          disabled={isRequested || isLoading}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isRequested
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 cursor-default'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 active:scale-95'
          }`}
          title={isRequested ? t('trackCard.requested') : t('trackCard.requestTitle')}
        >
          {isRequested ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('trackCard.requested')}</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('trackCard.request')}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
