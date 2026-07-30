import React from 'react';
import { USBLibrary, TrackRequest, RequestStatus } from '../types';
import { Download, FileSpreadsheet, Trash2, CheckCheck } from 'lucide-react';
import { exportRequestsAsText } from '../utils/api';
import { useI18n } from '../i18n/LanguageContext';

interface DJDashboardProps {
  library: USBLibrary;
  requests: TrackRequest[];
  onUpdateStatus: (requestId: string, status: RequestStatus) => void;
  onDeleteRequest: (requestId: string) => void;
  onClearToDownloadRequests?: () => void;
  onDeleteLibrary?: () => void;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const DJDashboard: React.FC<DJDashboardProps> = ({
  library,
  requests,
  onDeleteRequest,
  onClearToDownloadRequests,
}) => {
  const { t } = useI18n();
  const [confirmClearToDownload, setConfirmClearToDownload] = React.useState(false);
  const [exportOpen, setExportOpen] = React.useState(false);

  const toDownloadRequests = requests.filter(
    (r) => r.kind === 'wishlist' && r.status !== 'declined'
  );

  const handleExport = (format: 'txt' | 'csv') => {
    const content = exportRequestsAsText(toDownloadRequests, format);
    downloadBlob(
      `wenslijst-${library.slug || library.id}.${format}`,
      content,
      format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'
    );
    setExportOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              {t('dj.manageFor', { name: library.djName })}
            </h2>
            <p className="text-xs text-zinc-400">
              {t('dj.manageHint')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> {t('dj.exportDownloadList')}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              {t('dj.toDownload', { count: toDownloadRequests.length })}
            </h3>
            <span className="text-xs text-zinc-400 font-normal">
              {t('dj.toDownloadHint')}
            </span>
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
          <div className="text-center py-6 space-y-1 bg-zinc-950/60 rounded-xl border border-zinc-800/60">
            <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
            <p className="text-xs font-medium text-zinc-300">{t('dj.noneToDownload')}</p>
            <p className="text-[11px] text-zinc-500">
              {t('dj.noneToDownloadHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {toDownloadRequests.map((r, idx) => (
              <div
                key={r.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex items-center gap-2.5">
                  <span className="font-mono text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                  <div className="min-w-0 truncate">
                    <span className="font-bold text-zinc-100">{r.title}</span>
                    <span className="text-zinc-400 ml-1.5">— {r.artist}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteRequest(r.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg border border-red-900/40 shrink-0 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {exportOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">{t('dj.exportTitle')}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t('dj.exportHint')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleExport('txt')}
                className="w-full px-4 py-3 rounded-xl bg-cyan-950 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> TXT
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-3 rounded-xl bg-emerald-950 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> CSV
              </button>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearToDownload && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/80 text-red-400 border border-red-800/60 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-100">{t('dj.clearToDownloadTitle')}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t('dj.clearToDownloadBody')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmClearToDownload(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmClearToDownload(false);
                  onClearToDownloadRequests?.();
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
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
