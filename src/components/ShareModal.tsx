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
  /** Guests get copy that encourages sharing the code themselves. */
  isOwner?: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  library,
  showDjTips = true,
  isOwner = true,
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

  // Brand tokens: primary #00ffb2, background #0a0c10 (no # in QR API params)
  const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=00ffb2&bgcolor=0a0c10`;
  // Guests always see share copy; DJ tips only when enabled.
  const showSubtitle = !isOwner || showDjTips;

  return (
    <ModalShell
      open={isOpen && Boolean(library)}
      panelClassName="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground my-auto max-h-[90vh] flex flex-col"
    >
      {library && (
        <>
          <div className="px-5 py-4 border-b border-border bg-background/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{t('share.title')}</h3>
                {showSubtitle && (
                  <p className="text-[11px] text-muted-foreground">
                    {t(isOwner ? 'share.body' : 'share.bodyGuest')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto text-center space-y-3">
            <div className="space-y-1">
              <h4 className="font-bold text-primary text-sm">{library.djName || library.name}</h4>
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

          <div className="p-4 border-t border-border bg-background/80 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground"
            >
              {t('common.close')}
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
};
