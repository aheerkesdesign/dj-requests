import React from 'react';
import { X, Send, Sparkles, Music } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { errorMessage } from '../utils/errors';
import { ModalShell } from './ModalShell';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, artist: string) => Promise<void>;
  prefilledArtist?: string;
  prefilledTitle?: string;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledArtist = '',
  prefilledTitle = ''
}) => {
  const { t } = useI18n();
  const [title, setTitle] = React.useState('');
  const [artist, setArtist] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setTitle(prefilledTitle);
      setArtist(prefilledArtist);
      setError('');
    }
  }, [isOpen, prefilledTitle, prefilledArtist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('requestModal.titleRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(title.trim(), artist.trim());
      onClose();
    } catch (err: unknown) {
      setError(errorMessage(err, t('requestModal.submitError')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell
      open={isOpen}
      panelClassName="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground my-auto max-h-[90vh] flex flex-col"
    >
      <div className="px-5 py-4 border-b border-border bg-background/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-primary">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">{t('requestModal.title')}</h3>
            <p className="text-[11px] text-muted-foreground">{t('requestModal.subtitle')}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form id="request-modal-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
            <Music className="w-3.5 h-3.5 text-primary" /> {t('requestModal.titleLabel')}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t('requestModal.titlePlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary/40 focus:ring-1 focus:ring-primary/40 text-sm text-foreground outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            {t('requestModal.artistLabel')}
          </label>
          <input
            type="text"
            value={artist}
            onChange={e => setArtist(e.target.value)}
            placeholder={t('requestModal.artistPlaceholder')}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border focus:border-primary/40 text-sm text-foreground outline-none"
          />
        </div>
      </form>

      <div className="p-4 border-t border-border bg-background/80 flex items-center justify-end gap-2 shrink-0">
        <button
          type="submit"
          form="request-modal-form"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" /> {loading ? t('requestModal.submitting') : t('requestModal.submit')}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground"
        >
          {t('common.cancel')}
        </button>
      </div>
    </ModalShell>
  );
};
