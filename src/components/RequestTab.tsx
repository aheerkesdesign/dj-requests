import React from 'react';
import {
  TrackRequest,
  RequestStatus,
  Track,
  TrackFieldVisibility,
  DEFAULT_TRACK_FIELD_VISIBILITY,
  type RequestSortBy,
} from '../types';
import { Clock, Music2, CheckCheck, Trash2, Ban } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { CamelotBadge } from './CamelotBadge';
import { BpmBadge } from './BpmBadge';
import { ModalShell } from './ModalShell';
import { SearchBarAndFilters } from './SearchBarAndFilters';
import {
  useArriveFromEmpty,
  useClearListSequence,
  useEnteringIds,
  useExitingIds,
  useListFlipMotion,
  useRemoteListClear,
  useSortChangeMotion,
  MOTION_ENTER_MS,
  prefersReducedMotion,
} from '../hooks/useMotionPresence';
import { cn } from '@/lib/utils';
import { hasPresentMetaValue } from '../utils/library';

export type { RequestSortBy };

function needsMatchedTrackMeta(visibleFields: TrackFieldVisibility): boolean {
  return Boolean(
    visibleFields.album ||
      visibleFields.bpm ||
      visibleFields.key ||
      visibleFields.genre ||
      visibleFields.duration ||
      visibleFields.year
  );
}

const OPTIONAL_SORT_FIELDS: (keyof TrackFieldVisibility)[] = [
  'album',
  'bpm',
  'key',
  'genre',
  'duration',
  'year',
];

const OPTIONAL_SORT_LABEL_KEYS: Record<
  keyof TrackFieldVisibility,
  | 'settings.fieldAlbum'
  | 'settings.fieldBpm'
  | 'settings.fieldKey'
  | 'settings.fieldGenre'
  | 'settings.fieldDuration'
  | 'settings.fieldYear'
> = {
  album: 'settings.fieldAlbum',
  bpm: 'settings.fieldBpm',
  key: 'settings.fieldKey',
  genre: 'settings.fieldGenre',
  duration: 'settings.fieldDuration',
  year: 'settings.fieldYear',
};
interface RequestTabProps {
  requests: TrackRequest[];
  matchedByRequestId?: Map<string, Track>;
  /** False while catalog matches for optional BPM/key/album fields are still loading. */
  matchingReady?: boolean;
  onOpenRequestModal: () => void;
  isOwner: boolean;
  visibleFields?: TrackFieldVisibility;
  showPlayedDeclined?: boolean;
  showDjTips?: boolean;
  onUpdateStatus: (requestId: string, status: RequestStatus) => void;
  onDeleteRequest: (requestId: string) => void;
  onClearVerzoekjes?: () => void;
  /** Lifted so tab switches do not reset the choice. */
  sortBy: RequestSortBy;
  onSortByChange: (sortBy: RequestSortBy) => void;
}

interface SwipeableRequestCardProps {
  req: TrackRequest;
  matchingTrack?: Track;
  isOwner: boolean;
  visibleFields: TrackFieldVisibility;
  onSwipeCommit: (id: string, status: RequestStatus) => void;
  getStatusBadge: (status: RequestStatus) => React.ReactNode;
}

const SWIPE_THRESHOLD = 70;
const SWIPE_CLAMP = 140;
const SWIPE_COMMIT_MS = 250;

const SwipeableRequestCard: React.FC<SwipeableRequestCardProps> = ({
  req,
  matchingTrack,
  isOwner,
  visibleFields,
  onSwipeCommit,
  getStatusBadge,
}) => {
  const { t } = useI18n();
  const [offsetX, setOffsetX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const [isCommitting, setIsCommitting] = React.useState(false);
  const startXRef = React.useRef(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const commitStatusRef = React.useRef<RequestStatus | null>(null);
  const commitTimerRef = React.useRef<number | null>(null);
  const statusRef = React.useRef(req.status);

  // If this instance is reused after a status change (same list id), clear swipe chrome
  // so we never leave the hint layer visible with the card translated off-screen.
  if (statusRef.current !== req.status) {
    statusRef.current = req.status;
    if (offsetX !== 0 || isSwiping || isCommitting) {
      setOffsetX(0);
      setIsSwiping(false);
      setIsCommitting(false);
      commitStatusRef.current = null;
    }
  }

  React.useEffect(() => {
    return () => {
      if (commitTimerRef.current !== null) {
        window.clearTimeout(commitTimerRef.current);
      }
    };
  }, []);

  const handleStart = (clientX: number) => {
    if (!isOwner || isCommitting) return;
    startXRef.current = clientX;
    setIsSwiping(true);
  };

  const handleMove = (clientX: number) => {
    if (!isSwiping || !isOwner || isCommitting) return;
    const diffX = clientX - startXRef.current;
    const clampedX = Math.max(-SWIPE_CLAMP, Math.min(SWIPE_CLAMP, diffX));
    setOffsetX(clampedX);
  };

  const finishCommit = React.useCallback(() => {
    const status = commitStatusRef.current;
    commitStatusRef.current = null;
    if (status) onSwipeCommit(req.id, status);
  }, [onSwipeCommit, req.id]);

  const beginCommit = (status: RequestStatus, direction: 1 | -1) => {
    setIsSwiping(false);
    commitStatusRef.current = status;

    if (prefersReducedMotion()) {
      finishCommit();
      return;
    }

    setIsCommitting(true);
    const width = cardRef.current?.offsetWidth ?? 400;
    setOffsetX(direction * (width + 24));

    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = window.setTimeout(() => {
      commitTimerRef.current = null;
      finishCommit();
    }, SWIPE_COMMIT_MS);
  };

  const handleEnd = () => {
    if (!isSwiping || !isOwner || isCommitting) return;

    if (offsetX > SWIPE_THRESHOLD) {
      beginCommit('played', 1);
      return;
    }
    if (offsetX < -SWIPE_THRESHOLD) {
      beginCommit('declined', -1);
      return;
    }

    setIsSwiping(false);
    setOffsetX(0);
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.propertyName !== 'transform' || !isCommitting) return;
    if (commitTimerRef.current !== null) {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    finishCommit();
  };

  const isPlayed = req.status === 'played';
  const isDeclined = req.status === 'declined';
  const isMuted = isPlayed || isDeclined;

  const showAlbum = visibleFields.album && hasPresentMetaValue(matchingTrack?.album);
  const showBpm = visibleFields.bpm && hasPresentMetaValue(matchingTrack?.bpm);
  const showKey = visibleFields.key && hasPresentMetaValue(matchingTrack?.key) && matchingTrack?.key !== 'N/A';
  const showMeta = showAlbum || showBpm || showKey;

  const swipeProgress = Math.min(1, Math.abs(offsetX) / SWIPE_THRESHOLD);
  const swipeRight = offsetX > 0;
  const swipeLeft = offsetX < 0;
  const playedHintOpacity = swipeRight ? 0.3 + 0.7 * swipeProgress : 0.3;
  const declinedHintOpacity = swipeLeft ? 0.3 + 0.7 * swipeProgress : 0.3;

  let cardStyle = 'bg-card border-border/80 hover:border-border';
  if (isPlayed && swipeProgress === 0) {
    cardStyle = 'bg-card border-primary/30 opacity-80';
  } else if (isDeclined && swipeProgress === 0) {
    cardStyle = 'bg-card border-red-800/70 opacity-80';
  }

  const tintBorder =
    swipeRight && swipeProgress > 0
      ? `color-mix(in srgb, var(--color-primary) ${Math.round(swipeProgress * 50)}%, var(--color-border))`
      : swipeLeft && swipeProgress > 0
        ? `color-mix(in srgb, rgb(239 68 68) ${Math.round(swipeProgress * 50)}%, var(--color-border))`
        : undefined;

  return (
    <div ref={cardRef} className="relative overflow-hidden rounded-xl select-none group">
      {isOwner && (isSwiping || isCommitting) && Math.abs(offsetX) > 0 && (
        <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl text-xs font-bold bg-background border border-border">
          <div
            className="flex items-center gap-1.5 text-primary"
            style={{ opacity: playedHintOpacity }}
          >
            <CheckCheck className="w-5 h-5" />
            <span>{t('requests.played')}</span>
          </div>

          <div
            className="flex items-center gap-1.5 text-red-400"
            style={{ opacity: declinedHintOpacity }}
          >
            <span>{t('requests.declined')}</span>
            <Ban className="w-5 h-5" />
          </div>
        </div>
      )}

      <div
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => isSwiping && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => isSwiping && handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onTransitionEnd={handleTransitionEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping
            ? 'none'
            : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
          borderColor: tintBorder,
        }}
        className={cn(
          'relative z-10 rounded-xl border px-4 py-3 flex items-center justify-between gap-3 shadow-xs overflow-hidden',
          isOwner && !isCommitting ? 'cursor-grab active:cursor-grabbing' : '',
          cardStyle
        )}
      >
        {swipeProgress > 0 && (
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 pointer-events-none rounded-xl',
              swipeRight ? 'bg-primary' : 'bg-red-500'
            )}
            style={{ opacity: swipeProgress * 0.15 }}
          />
        )}
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm leading-snug truncate ${isMuted ? 'font-medium text-muted-foreground' : 'font-bold text-foreground'}`}
            >
              {req.title}
            </h3>
            {getStatusBadge(req.status)}
          </div>

          <p
            className={`text-xs truncate mt-1 ${isMuted ? 'text-muted-foreground font-normal' : 'text-muted-foreground font-medium'}`}
          >
            {req.artist}
          </p>

          {showMeta && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 min-w-0">
              {showAlbum && (
                <span
                  className={`text-xs truncate max-w-full ${isMuted ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                >
                  {matchingTrack!.album}
                </span>
              )}
              {showAlbum && (showBpm || showKey) && (
                <span className="text-muted-foreground text-xs" aria-hidden>
                  ·
                </span>
              )}
              {showBpm && <BpmBadge bpm={matchingTrack!.bpm} size="sm" />}
              {showBpm && showKey && (
                <span className="text-muted-foreground text-xs" aria-hidden>
                  ·
                </span>
              )}
              {showKey && <CamelotBadge keyString={matchingTrack!.key} size="sm" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RequestTab: React.FC<RequestTabProps> = ({
  requests,
  matchedByRequestId,
  matchingReady = true,
  onOpenRequestModal,
  isOwner,
  visibleFields = DEFAULT_TRACK_FIELD_VISIBILITY,
  showPlayedDeclined = true,
  showDjTips = true,
  onUpdateStatus,
  onDeleteRequest: _onDeleteRequest,
  onClearVerzoekjes,
  sortBy,
  onSortByChange,
}) => {
  const { t } = useI18n();
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [confirmClearVerzoekjes, setConfirmClearVerzoekjes] = React.useState(false);
  const [parkedIds, setParkedIds] = React.useState<Set<string>>(() => new Set());
  const markEnteringRef = React.useRef<(id: string) => void>(() => {});
  const { requestExit, isExiting } = useExitingIds(MOTION_ENTER_MS);
  const { beginAfterModalClose, listExiting, emptyEntering, clearBusy } = useClearListSequence(() => {
    onClearVerzoekjes?.();
  });
  const {
    displaySortBy,
    listMotionClass: sortListMotionClass,
    sortMotionBusy,
  } = useSortChangeMotion(sortBy);
  const listContainerRef = React.useRef<HTMLDivElement>(null);

  const needsMeta = needsMatchedTrackMeta(visibleFields);
  // Keep the last fully-matched list on screen while new matches load — no spinner,
  // and never flash a row before BPM/album/key/etc. are ready.
  const publishedRef = React.useRef<{
    requests: TrackRequest[];
    matchedByRequestId?: Map<string, Track>;
  } | null>(null);
  if (!needsMeta || matchingReady) {
    publishedRef.current = { requests, matchedByRequestId };
  }
  const listRequests =
    !needsMeta || matchingReady ? requests : (publishedRef.current?.requests ?? []);
  const listMatched =
    !needsMeta || matchingReady
      ? matchedByRequestId
      : publishedRef.current?.matchedByRequestId;

  const sortOptions = React.useMemo(() => {
    const options: { value: RequestSortBy; label: string; title?: string }[] = [
      {
        value: 'order',
        label: t('requests.sortOrder'),
        title: t('requests.sortOrderHint'),
      },
      { value: 'title', label: t('requests.sortTitle') },
      { value: 'artist', label: t('requests.sortArtist') },
    ];
    for (const field of OPTIONAL_SORT_FIELDS) {
      if (visibleFields[field]) {
        options.push({ value: field, label: t(OPTIONAL_SORT_LABEL_KEYS[field]) });
      }
    }
    return options;
  }, [t, visibleFields]);

  React.useEffect(() => {
    if (!sortOptions.some((o) => o.value === sortBy)) {
      onSortByChange('order');
    }
  }, [sortBy, sortOptions, onSortByChange]);

  // Filter requests to show ONLY playable tracks (in the DJ's library)
  const usbRequests = listRequests.filter(r => r.kind === 'playable');
  const holdingForMeta = needsMeta && !matchingReady && !publishedRef.current;
  const {
    displayItems: displayUsbRequests,
    listExiting: remoteListExiting,
    emptyEntering: remoteEmptyEntering,
  } = useRemoteListClear(usbRequests, clearBusy);
  const listArriving = useArriveFromEmpty(usbRequests.length, !holdingForMeta);
  const showListExiting = listExiting || remoteListExiting;
  const showEmptyEntering = emptyEntering || remoteEmptyEntering;

  const getStatusRank = (status: RequestStatus) => {
    if (status === 'pending') return 0;
    if (status === 'played') return 1;
    if (status === 'declined') return 2;
    return 0;
  };

  const compareOptionalField = (a: TrackRequest, b: TrackRequest): number => {
    const trackA = listMatched?.get(a.id);
    const trackB = listMatched?.get(b.id);

    if (displaySortBy === 'bpm') {
      const bpmA = trackA?.bpm;
      const bpmB = trackB?.bpm;
      const hasA = hasPresentMetaValue(bpmA);
      const hasB = hasPresentMetaValue(bpmB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return (bpmA as number) - (bpmB as number);
    }

    if (displaySortBy === 'duration') {
      const durA = trackA?.duration;
      const durB = trackB?.duration;
      const hasA = hasPresentMetaValue(durA);
      const hasB = hasPresentMetaValue(durB);
      if (!hasA && !hasB) return 0;
      if (!hasA) return 1;
      if (!hasB) return -1;
      return (durA as number) - (durB as number);
    }

    const textA = (
      displaySortBy === 'album'
        ? trackA?.album
        : displaySortBy === 'key'
          ? trackA?.key
          : displaySortBy === 'genre'
            ? trackA?.genre
            : displaySortBy === 'year'
              ? trackA?.year
              : undefined
    );
    const textB = (
      displaySortBy === 'album'
        ? trackB?.album
        : displaySortBy === 'key'
          ? trackB?.key
          : displaySortBy === 'genre'
            ? trackB?.genre
            : displaySortBy === 'year'
              ? trackB?.year
              : undefined
    );

    const hasA = hasPresentMetaValue(textA) && (displaySortBy !== 'key' || textA !== 'N/A');
    const hasB = hasPresentMetaValue(textB) && (displaySortBy !== 'key' || textB !== 'N/A');
    if (!hasA && !hasB) return 0;
    if (!hasA) return 1;
    if (!hasB) return -1;
    return String(textA).trim().localeCompare(String(textB).trim(), undefined, {
      sensitivity: 'base',
      numeric: true,
    });
  };

  const sortedRequests = [...displayUsbRequests].sort((a, b) => {
    // Always keep status groups: pending → played → declined
    const rankA = getStatusRank(a.status);
    const rankB = getStatusRank(b.status);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Within a status group, apply the selected sort
    if (displaySortBy === 'order') {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      // Pending: oldest first. Played/declined: newest first.
      if (rankA === 0) return timeA - timeB;
      return timeB - timeA;
    }

    if (displaySortBy === 'title' || displaySortBy === 'artist') {
      const fieldA = (displaySortBy === 'artist' ? a.artist : a.title).toLowerCase();
      const fieldB = (displaySortBy === 'artist' ? b.artist : b.title).toLowerCase();
      const fieldCmp = fieldA.localeCompare(fieldB, undefined, { sensitivity: 'base' });
      if (fieldCmp !== 0) return fieldCmp;
    } else {
      const fieldCmp = compareOptionalField(a, b);
      if (fieldCmp !== 0) return fieldCmp;
    }

    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;
    return timeA - timeB;
  });

  const filteredRequests = sortedRequests.filter((r) => {
    // Hide played/declined from guests when the DJ has disabled showing them
    if (!isOwner && !showPlayedDeclined && (r.status === 'played' || r.status === 'declined'))
      return false;
    if (filterStatus === 'pending' && r.status !== 'pending') return false;
    if (filterStatus === 'played' && r.status !== 'played') return false;
    if (filterStatus === 'declined' && r.status !== 'declined') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q);
    }
    return true;
  });

  // Keep exiting rows visible at their pre-update slot; park after exit so the
  // same id can leave and re-enter (enter animation + neighbor FLIP).
  const displayRequests = filteredRequests.filter(
    (r) => !parkedIds.has(r.id) || isExiting(r.id)
  );

  const handleSwipeCommit = React.useCallback(
    (id: string, status: RequestStatus) => {
      if (prefersReducedMotion()) {
        onUpdateStatus(id, status);
        return;
      }

      requestExit(id, () => {
        // Hide for one frame so the same list id remounts at the destination
        // (clears local swipe translate) instead of React reusing the slid-off card.
        setParkedIds((prev) => {
          if (prev.has(id)) return prev;
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        onUpdateStatus(id, status);
        requestAnimationFrame(() => {
          setParkedIds((prev) => {
            if (!prev.has(id)) return prev;
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          markEnteringRef.current(id);
        });
      });
    },
    [onUpdateStatus, requestExit]
  );

  const filteredIds = displayRequests.map((r) => r.id);
  const insertMotionEnabled =
    !holdingForMeta && !showListExiting && !listArriving && !sortMotionBusy;
  const { isEntering, enteringIds, markEntering } = useEnteringIds(
    filteredIds,
    insertMotionEnabled
  );
  markEnteringRef.current = markEntering;
  // While rows expand open, layout itself pushes neighbors — FLIP would fight that.
  useListFlipMotion(
    listContainerRef,
    filteredIds,
    insertMotionEnabled && enteringIds.size === 0
  );

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 text-muted-foreground" /> {t('requests.pending')}
          </span>
        );
      case 'played':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-md">
            <CheckCheck className="w-3 h-3 text-primary" /> {t('requests.played')}
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-950/50 text-red-400 border border-red-800/60 px-2 py-0.5 rounded-md">
            <Ban className="w-3 h-3 text-red-400" /> {t('requests.declined')}
          </span>
        );
    }
  };

  const showStatusFilters = isOwner || showPlayedDeclined;

  return (
    <div className="space-y-4">
      {/* Status filters (hidden for guests when played/declined are not shown) */}
      {showStatusFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {t('requests.all')}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                filterStatus === 'pending'
                  ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {t('requests.pending')}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('played')}
              className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                filterStatus === 'played'
                  ? 'bg-primary/15 border-primary/60 text-primary'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {t('requests.played')}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('declined')}
              className={`px-3 py-1 rounded-lg border font-medium transition-all ${
                filterStatus === 'declined'
                  ? 'bg-red-950/80 border-red-600 text-red-300'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {t('requests.declined')}
            </button>
          </div>

          {isOwner && displayUsbRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearVerzoekjes(true)}
              className={cn(
                'px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 self-end sm:self-auto',
                listArriving && 'motion-fade-in-place'
              )}
              title={t('requests.clearTitle')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('requests.clear')}</span>
            </button>
          )}
        </div>
      )}

      <SearchBarAndFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortMenu={{
          value: sortBy,
          options: sortOptions,
          onChange: (value) => onSortByChange(value as RequestSortBy),
        }}
      />

      {/* DJ Swipe Tip banner */}
      {isOwner && showDjTips && displayUsbRequests.length > 0 && (
        <div
          className={cn(
            'bg-card/80 border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground',
            listArriving && 'motion-fade-in-place',
            showListExiting && 'motion-panel-exit'
          )}
        >
          <span>{t('requests.djTip')}</span>
        </div>
      )}

      {/* Hold new/updated rows until catalog matches so optional meta arrives with them */}
      {holdingForMeta ? null : filteredRequests.length === 0 && parkedIds.size === 0 ? (
        <div
          className={cn(
            'bg-card/50 border border-border/80 rounded-2xl p-8 text-center my-2 space-y-2',
            showEmptyEntering && 'motion-panel-enter'
          )}
        >
          <Music2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <div className="max-w-xs mx-auto">
            <h4 className="text-sm font-bold text-foreground">{t('requests.emptyCategory')}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {t('requests.empty')}
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={listContainerRef}
          className={cn(
            'flex flex-col',
            showListExiting && 'motion-panel-exit',
            listArriving && 'motion-panel-enter',
            !showListExiting && !listArriving && sortListMotionClass
          )}
        >
          {displayRequests.map((req, index) => {
            const matchingTrack = listMatched?.get(req.id);
            const entering = isEntering(req.id);
            const exiting = isExiting(req.id);
            return (
              <div
                key={`${req.id}:${req.status}`}
                data-list-id={req.id}
                className={cn(
                  exiting && 'motion-list-item-exit',
                  entering && 'motion-list-item-enter'
                )}
              >
                <div
                  className={cn(
                    (entering || exiting) && 'motion-list-item-enter-clip'
                  )}
                >
                  <div className={cn(index > 0 && 'pt-2.5')}>
                    <SwipeableRequestCard
                      req={req}
                      matchingTrack={matchingTrack}
                      isOwner={isOwner}
                      visibleFields={visibleFields}
                      onSwipeCommit={handleSwipeCommit}
                      getStatusBadge={getStatusBadge}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalShell
        open={confirmClearVerzoekjes}
        panelClassName="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800/60 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">{t('requests.clearConfirmTitle')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('requests.clearConfirmBody')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setConfirmClearVerzoekjes(false)}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirmClearVerzoekjes(false);
              beginAfterModalClose();
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-xs"
          >
            {t('common.yesClearAll')}
          </button>
        </div>
      </ModalShell>
    </div>
  );
};
