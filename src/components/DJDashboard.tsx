import React from 'react';
import { TrackRequest } from '../types';
import { Trash2, CheckCheck } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import {
  MOTION_ENTER_MS,
  prefersReducedMotion,
  useArriveFromEmpty,
  useClearListSequence,
  useExitingIds,
  useRemoteListClear,
} from '../hooks/useMotionPresence';
import { ModalShell } from './ModalShell';
import { cn } from '@/lib/utils';

interface DJDashboardProps {
  requests: TrackRequest[];
  onDeleteRequest: (requestId: string) => void;
  onClearToDownloadRequests?: () => void;
  showDjTips?: boolean;
}

export const DJDashboard: React.FC<DJDashboardProps> = ({
  requests,
  onDeleteRequest,
  onClearToDownloadRequests,
  showDjTips = true,
}) => {
  const { t } = useI18n();
  const [confirmClearToDownload, setConfirmClearToDownload] = React.useState(false);
  // After the last row finishes its list-item exit, skip remote snapshot remount
  // and fade the empty state in directly.
  const [lastItemClearBusy, setLastItemClearBusy] = React.useState(false);
  const [lastItemEmptyEntering, setLastItemEmptyEntering] = React.useState(false);
  const lastItemTimerRef = React.useRef<number | null>(null);
  // Match --duration-motion-slow on .motion-list-item-exit (default exitMs is too short).
  const { requestExit, isExiting } = useExitingIds(MOTION_ENTER_MS);
  const { beginAfterModalClose, listExiting, emptyEntering, clearBusy } = useClearListSequence(() => {
    onClearToDownloadRequests?.();
  });

  React.useEffect(() => {
    return () => {
      if (lastItemTimerRef.current !== null) {
        window.clearTimeout(lastItemTimerRef.current);
      }
    };
  }, []);

  const toDownloadRequests = requests.filter(
    (r) => r.kind === 'wishlist' && r.status !== 'declined'
  );
  const {
    displayItems: displayToDownload,
    listExiting: remoteListExiting,
    emptyEntering: remoteEmptyEntering,
  } = useRemoteListClear(toDownloadRequests, clearBusy || lastItemClearBusy);
  const listArriving = useArriveFromEmpty(displayToDownload.length, true);
  const showListExiting = listExiting || remoteListExiting;
  const showEmptyEntering =
    emptyEntering || remoteEmptyEntering || lastItemEmptyEntering;

  const handleClearAll = () => {
    setConfirmClearToDownload(false);
    beginAfterModalClose();
  };

  const handleDeleteOne = (id: string) => {
    const isLast = toDownloadRequests.length === 1;
    requestExit(id, () => {
      if (!isLast || prefersReducedMotion()) {
        onDeleteRequest(id);
        return;
      }
      setLastItemClearBusy(true);
      onDeleteRequest(id);
      setLastItemEmptyEntering(true);
      if (lastItemTimerRef.current !== null) {
        window.clearTimeout(lastItemTimerRef.current);
      }
      lastItemTimerRef.current = window.setTimeout(() => {
        lastItemTimerRef.current = null;
        setLastItemEmptyEntering(false);
        setLastItemClearBusy(false);
      }, MOTION_ENTER_MS);
    });
  };

  return (
    <div className="space-y-4">
      {displayToDownload.length > 0 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => setConfirmClearToDownload(true)}
            className={cn(
              'px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0',
              listArriving && 'motion-fade-in-place'
            )}
            title={t('dj.clearToDownload')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('dj.clearToDownload')}</span>
          </button>
        </div>
      )}

      {showDjTips && displayToDownload.length > 0 && (
        <div
          className={cn(
            'bg-card/80 border border-border/80 rounded-xl px-3.5 py-2 text-xs text-foreground',
            listArriving && 'motion-fade-in-place',
            showListExiting && 'motion-panel-exit'
          )}
        >
          <span>{t('dj.toDownloadHint')}</span>
        </div>
      )}

      {displayToDownload.length === 0 ? (
        <div
          className={cn(
            'bg-card/50 border border-border/80 rounded-2xl p-8 text-center my-2 space-y-2',
            showEmptyEntering && 'motion-panel-enter'
          )}
        >
          <CheckCheck className="w-10 h-10 text-muted-foreground mx-auto" />
          <div className="max-w-xs mx-auto">
            <h4 className="text-sm font-bold text-foreground">{t('dj.noneToDownload')}</h4>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col',
            showListExiting && 'motion-panel-exit',
            listArriving && 'motion-panel-enter'
          )}
        >
          {displayToDownload.map((r, index) => {
            const hasGapBelow = index < displayToDownload.length - 1;
            const exiting = isExiting(r.id);
            return (
              <div
                key={r.id}
                className={cn(exiting && 'motion-list-item-exit')}
              >
                <div className={cn(exiting && 'motion-list-item-enter-clip')}>
                  <div className={cn(hasGapBelow && 'pb-2.5')}>
                    <div className="rounded-xl border border-border/80 bg-card px-4 py-3 flex items-center justify-between gap-3 shadow-xs">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold leading-snug truncate text-foreground">
                          {r.title}
                        </h3>
                        <p className="text-xs truncate mt-1 text-muted-foreground font-medium">
                          {r.artist}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteOne(r.id)}
                        className="p-2 text-muted-foreground hover:text-red-300 hover:bg-red-950/50 rounded-lg border border-transparent hover:border-red-900/40 shrink-0 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ModalShell
        open={confirmClearToDownload}
        panelClassName="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800/60 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">{t('dj.clearToDownloadTitle')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('dj.clearToDownloadBody')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setConfirmClearToDownload(false)}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-xs"
          >
            {t('common.yesClearAll')}
          </button>
        </div>
      </ModalShell>
    </div>
  );
};
