import React from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
import { USBLibrary } from '../types';
import { buildShareUrl } from '../utils/api';
import { useI18n } from '../i18n/LanguageContext';
import { ModalShell } from './ModalShell';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: USBLibrary | null;
  showDjTips?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  library,
  showDjTips = true,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);

  const slug = library?.slug;
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
    <ModalShell
      open={isOpen && Boolean(library)}
      panelClassName="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground p-5 space-y-4"
    >
      {library && (
        <>
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">{t('share.title')}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center space-y-3">
            <div className="space-y-1">
              <h4 className="font-bold text-primary text-sm">{library.djName || library.name}</h4>
              {showDjTips && (
                <p className="text-xs text-muted-foreground">
                  {t('share.body')}
                </p>
              )}
              {slug && (
                <p className="text-[10px] font-mono text-muted-foreground">/d/{slug}</p>
              )}
            </div>

            <div className="p-3 bg-background border border-border rounded-xl inline-block shadow-inner my-1">
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="w-44 h-44 rounded-lg mx-auto"
                loading="lazy"
              />
              <span className="text-[10px] text-muted-foreground block mt-1 font-mono">{t('share.scan')}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-xl border border-border">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full px-2 py-1 text-xs bg-transparent text-foreground font-mono outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground"
            >
              {t('common.close')}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
};
