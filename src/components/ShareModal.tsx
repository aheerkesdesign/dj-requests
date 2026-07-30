import React from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { USBLibrary } from '../types';
import { buildShareUrl } from '../utils/api';
import { useI18n } from '../i18n/LanguageContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: USBLibrary | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, library }) => {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !library) return null;

  const slug = library.slug;
  const currentUrl = slug
    ? buildShareUrl(slug)
    : typeof window !== 'undefined'
      ? window.location.href
      : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=10b981&bgcolor=09090b`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-zinc-100">{t('share.title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-3">
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-400 text-sm">{library.djName || library.name}</h4>
            <p className="text-xs text-zinc-400">
              {t('share.body', { count: library.trackCount })}
            </p>
            {slug && (
              <p className="text-[10px] font-mono text-zinc-500">/d/{slug}</p>
            )}
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl inline-block shadow-inner my-1">
            <img
              src={qrCodeDataUrl}
              alt="QR Code"
              className="w-44 h-44 rounded-lg mx-auto"
              loading="lazy"
            />
            <span className="text-[10px] text-zinc-500 block mt-1 font-mono">{t('share.scan')}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="w-full px-2 py-1 text-xs bg-transparent text-zinc-300 font-mono outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
