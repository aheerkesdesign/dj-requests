import React from 'react';
import {
  TrackRequest,
  RequestStatus,
  Track,
  TrackFieldVisibility,
  DEFAULT_TRACK_FIELD_VISIBILITY,
} from '../types';
import { Clock, Music2, CheckCheck, Trash2, Search, Ban } from 'lucide-react';
import { findTrackInLibrary } from '../utils/library';
import { useI18n } from '../i18n/LanguageContext';
import { CamelotBadge } from './CamelotBadge';
import { BpmBadge } from './BpmBadge';

interface RequestTabProps {
  requests: TrackRequest[];
  libraryTracks?: Track[];
  onOpenRequestModal: () => void;
  isOwner: boolean;
  visibleFields?: TrackFieldVisibility;
  hidePlayedDeclined?: boolean;
  onUpdateStatus: (requestId: string, status: RequestStatus) => void;
  onDeleteRequest: (requestId: string) => void;
  onClearVerzoekjes?: () => void;
}

interface SwipeableRequestCardProps {
  req: TrackRequest;
  matchingTrack?: Track;
  isOwner: boolean;
  visibleFields: TrackFieldVisibility;
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onDeleteRequest: (id: string) => void;
  getStatusBadge: (status: RequestStatus) => React.ReactNode;
}

const SwipeableRequestCard: React.FC<SwipeableRequestCardProps> = ({
  req,
  matchingTrack,
  isOwner,
  visibleFields,
  onUpdateStatus,
  onDeleteRequest,
  getStatusBadge
}) => {
  const { t } = useI18n();
  const [offsetX, setOffsetX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const startXRef = React.useRef<number>(0);

  const SWIPE_THRESHOLD = 70;

  const handleStart = (clientX: number) => {
    if (!isOwner) return;
    startXRef.current = clientX;
    setIsSwiping(true);
  };

  const handleMove = (clientX: number) => {
    if (!isSwiping || !isOwner) return;
    const diffX = clientX - startXRef.current;
    const clampedX = Math.max(-140, Math.min(140, diffX));
    setOffsetX(clampedX);
  };

  const handleEnd = () => {
    if (!isSwiping || !isOwner) return;
    setIsSwiping(false);

    if (offsetX > SWIPE_THRESHOLD) {
      onUpdateStatus(req.id, 'played');
    } else if (offsetX < -SWIPE_THRESHOLD) {
      onUpdateStatus(req.id, 'declined');
    }

    setOffsetX(0);
  };

  const isPlayed = req.status === 'played';
  const isDeclined = req.status === 'declined';
  const isMuted = isPlayed || isDeclined;

  const showAlbum = visibleFields.album && Boolean(matchingTrack?.album);
  const showBpm = visibleFields.bpm && Boolean(matchingTrack?.bpm);
  const showKey = visibleFields.key && Boolean(matchingTrack?.key);
  const showMeta = showAlbum || showBpm || showKey;

  let cardStyle = 'bg-zinc-900 border-zinc-800/80 hover:border-zinc-700/80';
  if (offsetX > 30) {
    cardStyle = 'bg-emerald-950/50 border-emerald-500/50';
  } else if (offsetX < -30) {
    cardStyle = 'bg-red-950/50 border-red-500/50';
  } else if (isPlayed) {
    cardStyle = 'bg-zinc-900 border-emerald-800/70 opacity-80';
  } else if (isDeclined) {
    cardStyle = 'bg-zinc-900 border-red-800/70 opacity-80';
  }

  return (
    <div className="relative overflow-hidden rounded-xl select-none group">
      {isOwner && Math.abs(offsetX) > 0 && (
        <div className="absolute inset-0 flex items-center justify-between px-4 rounded-xl text-xs font-bold bg-zinc-950 border border-zinc-800">
          <div
            className={`flex items-center gap-1.5 transition-opacity duration-150 ${
              offsetX > 20 ? 'opacity-100 text-emerald-400' : 'opacity-30 text-emerald-600'
            }`}
          >
            <CheckCheck className="w-5 h-5" />
            <span>{t('requests.played')}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 transition-opacity duration-150 ${
              offsetX < -20 ? 'opacity-100 text-red-400' : 'opacity-30 text-red-600'
            }`}
          >
            <span>{t('requests.declined')}</span>
            <Ban className="w-5 h-5" />
          </div>
        </div>
      )}

      <div
        onMouseDown={e => handleStart(e.clientX)}
        onMouseMove={e => isSwiping && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={e => handleStart(e.touches[0].clientX)}
        onTouchMove={e => isSwiping && handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className={`relative z-10 rounded-xl border px-4 py-3 flex items-center justify-between gap-3 shadow-xs transition-all ${
          isOwner ? 'cursor-grab active:cursor-grabbing' : ''
        } ${cardStyle}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-sm leading-snug truncate ${isMuted ? 'font-medium text-zinc-400' : 'font-bold text-zinc-100'}`}>
              {req.title}
            </h3>
            {getStatusBadge(req.status)}
          </div>

          <p className={`text-xs truncate mt-1 ${isMuted ? 'text-zinc-500 font-normal' : 'text-zinc-400 font-medium'}`}>
            {req.artist}
          </p>

          {showMeta && (
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 min-w-0">
              {showAlbum && (
                <span className={`text-xs truncate max-w-full ${isMuted ? 'text-zinc-600' : 'text-zinc-500'}`}>
                  {matchingTrack!.album}
                </span>
              )}
              {showAlbum && (showBpm || showKey) && (
                <span className="text-zinc-700 text-xs" aria-hidden>
                  ·
                </span>
              )}
              {showBpm && <BpmBadge bpm={matchingTrack!.bpm} size="sm" />}
              {showBpm && showKey && (
                <span className="text-zinc-700 text-xs" aria-hidden>
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
  libraryTracks = [],
  onOpenRequestModal,
  isOwner,
  visibleFields = DEFAULT_TRACK_FIELD_VISIBILITY,
  hidePlayedDeclined = false,
  onUpdateStatus,
  onDeleteRequest,
  onClearVerzoekjes
}) => {
  const { t } = useI18n();
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchFilter, setSearchFilter] = React.useState('');
  const [confirmClearVerzoekjes, setConfirmClearVerzoekjes] = React.useState(false);

  // Filter requests to show ONLY playable tracks (in the DJ's library)
  const usbRequests = requests.filter(r => r.kind === 'playable');

  // Sorting:
  // 1. In afwachting (pending): van oud naar nieuw (ascending)
  // 2. Gedraaid (played): van nieuw naar oud (descending)
  // 3. Geweigerd (declined): van nieuw naar oud (descending)
  const getStatusRank = (status: RequestStatus) => {
    if (status === 'pending') return 0;
    if (status === 'played') return 1;
    if (status === 'declined') return 2;
    return 0;
  };

  const sortedRequests = [...usbRequests].sort((a, b) => {
    const rankA = getStatusRank(a.status);
    const rankB = getStatusRank(b.status);
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    const timeA = new Date(a.createdAt).getTime() || 0;
    const timeB = new Date(b.createdAt).getTime() || 0;

    // Rank 0: In afwachting -> van oud naar nieuw
    if (rankA === 0) {
      return timeA - timeB;
    }

    // Rank 1 & 2: Gedraaid & Geweigerd -> van nieuw naar oud
    return timeB - timeA;
  });

  const filteredRequests = sortedRequests.filter(r => {
    // Hide played/declined from guests when the DJ has enabled that setting
    if (!isOwner && hidePlayedDeclined && (r.status === 'played' || r.status === 'declined')) return false;
    if (filterStatus === 'pending' && r.status !== 'pending') return false;
    if (filterStatus === 'played' && r.status !== 'played') return false;
    if (filterStatus === 'declined' && r.status !== 'declined') return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.artist.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 text-amber-400" /> {t('requests.pending')}
          </span>
        );
      case 'played':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-md">
            <CheckCheck className="w-3 h-3 text-emerald-400" /> {t('requests.played')}
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

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-lg border font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {t('requests.all', { count: usbRequests.length })}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded-lg border font-medium transition-all ${
              filterStatus === 'pending'
                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {t('requests.pending')}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('played')}
            className={`px-3 py-1 rounded-lg border font-medium transition-all ${
              filterStatus === 'played'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
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
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}
          >
            {t('requests.declined')}
          </button>
        </div>

        {/* Right Controls: Quick Search & Clear All for DJ */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[160px] flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder={t('requests.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
            />
          </div>

          {isOwner && usbRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearVerzoekjes(true)}
              className="px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              title={t('requests.clearTitle')}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('requests.clear')}</span>
            </button>
          )}
        </div>
      </div>

      {/* DJ Swipe Tip banner */}
      {isOwner && usbRequests.length > 0 && (
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-300">
          <span>{t('requests.djTip')}</span>
        </div>
      )}

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-8 text-center my-2 space-y-2">
          <Music2 className="w-10 h-10 text-zinc-600 mx-auto" />
          <div className="max-w-xs mx-auto">
            <h4 className="text-sm font-bold text-zinc-200">{t('requests.emptyCategory')}</h4>
            <p className="text-xs text-zinc-400 mt-1">
              {t('requests.empty')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRequests.map(req => {
            const matchingTrack = findTrackInLibrary(req, libraryTracks);
            return (
              <SwipeableRequestCard
                key={req.id}
                req={req}
                matchingTrack={matchingTrack}
                isOwner={isOwner}
                visibleFields={visibleFields}
                onUpdateStatus={onUpdateStatus}
                onDeleteRequest={onDeleteRequest}
                getStatusBadge={getStatusBadge}
              />
            );
          })}
        </div>
      )}

      {/* Popup Modal for Confirming Clear Verzoekjes */}
      {confirmClearVerzoekjes && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800/60 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">{t('requests.clearConfirmTitle')}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t('requests.clearConfirmBody')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearVerzoekjes(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClearVerzoekjes(false);
                  onClearVerzoekjes?.();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-xs"
              >
                {t('common.yesClearAll')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
