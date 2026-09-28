import React from 'react';
import { TrackRequest } from '../types';
import { Download, Trash2, CheckCheck } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { useClearListSequence, useExitingIds } from '../hooks/useMotionPresence';
import { ModalShell } from './ModalShell';
import { cn } from '@/lib/utils';

interface DJDashboardProps {
  requests: TrackRequest[];
  onDeleteRequest: (requestId: string) => void;
  onClearToDownloadRequests?: () => void;
  hideDjTips?: boolean;
}

export const DJDashboard: React.FC<DJDashboardProps> = ({
  requests,
  onDeleteRequest,
  onClearToDownloadRequests,
  hideDjTips = false,
}) => {
  const { t } = useI18n();
  const [confirmClearToDownload, setConfirmClearToDownload] = React.useState(false);
  const { requestExit, isExiting } = useExitingIds();
  const { beginAfterModalClose, listExiting, emptyEntering } = useClearListSequence(() => {
    onClearToDownloadRequests?.();
  });

  const toDownloadRequests = requests.filter(
    (r) => r.kind === 'wishlist' && r.status !== 'declined'
  );

  const handleClearAll = () => {
    setConfirmClearToDownload(false);
    beginAfterModalClose();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              {t('dj.toDownload', { count: toDownloadRequests.length })}
            </h3>
            {!hideDjTips && (
              <span className="text-xs text-muted-foreground font-normal">
                {t('dj.toDownloadHint')}
              </span>
            )}
          </div>

          {toDownloadRequests.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearToDownload(true)}
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('dj.clearToDownload')}</span>
            </button>
          )}
        </div>

        {toDownloadRequests.length === 0 ? (
          <div
            className={cn(
              'text-center py-6 space-y-1 bg-background/60 rounded-xl border border-border/60',
              emptyEntering && 'motion-panel-enter'
            )}
          >
            <CheckCheck className="w-8 h-8 text-primary mx-auto opacity-80" />
            <p className="text-xs font-medium text-foreground">{t('dj.noneToDownload')}</p>
            <p className="text-[11px] text-muted-foreground">
              {t('dj.noneToDownloadHint')}
            </p>
          </div>
        ) : (
          <div className={cn('space-y-2', listExiting && 'motion-panel-exit')}>
            {toDownloadRequests.map((r, idx) => (
              <div
                key={r.id}
                className={cn(
                  'p-3 rounded-xl bg-background border border-border flex items-center justify-between gap-3 text-xs',
                  isExiting(r.id) && 'motion-panel-exit'
                )}
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="font-heading text-primary font-bold shrink-0 tabular-nums">#{idx + 1}</span>
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-foreground">{r.title}</span>
                    <span className="text-muted-foreground ml-1.5">— {r.artist}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => requestExit(r.id, () => onDeleteRequest(r.id))}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg border border-red-900/40 shrink-0 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalShell
        open={confirmClearToDownload}
        panelClassName="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
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
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
          >
            {t('common.yesClearAll')}
          </button>
        </div>
      </ModalShell>
    </div>
  );
};
