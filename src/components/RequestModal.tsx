import React from 'react';
import { X, Send, Sparkles, Music } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { errorMessage } from '../utils/errors';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">{t('requestModal.title')}</h3>
              <p className="text-[11px] text-zinc-400">{t('requestModal.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-emerald-400" /> {t('requestModal.titleLabel')}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('requestModal.titlePlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-zinc-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              {t('requestModal.artistLabel')}
            </label>
            <input
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder={t('requestModal.artistPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-sm text-zinc-100 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" /> {loading ? t('requestModal.submitting') : t('requestModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
