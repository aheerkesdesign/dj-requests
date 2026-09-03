import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Sparkles, AlertTriangle, Upload, Globe, Share2, LogOut, ImageIcon } from 'lucide-react';
import { USBLibrary, SocialLinks } from '../types';
import { useAuth } from '../lib/auth';
import { useI18n } from '../i18n/LanguageContext';

const EMPTY_SOCIALS: SocialLinks = {
  instagram: '',
  tiktok: '',
  youtube: '',
  facebook: '',
  x: '',
  spotify: '',
  soundcloud: '',
  mixcloud: '',
  website: '',
};

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLibrary: USBLibrary | null;
  onUpdateDetails: (updates: {
    name?: string;
    djName?: string;
    logoUrl?: string;
    logoBlob?: Blob;
    startImageUrl?: string;
    startImageBlob?: Blob;
    socials?: SocialLinks;
    slug?: string;
  }) => Promise<void>;
  allowProfileEdit?: boolean;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentLibrary,
  onUpdateDetails,
  allowProfileEdit = true,
}) => {
  const { t } = useI18n();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [djName, setDjName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoBlob, setLogoBlob] = useState<Blob | null>(null);
  const [startImageUrl, setStartImageUrl] = useState('');
  const [startImageBlob, setStartImageBlob] = useState<Blob | null>(null);
  const [socials, setSocials] = useState<SocialLinks>(EMPTY_SOCIALS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && currentLibrary) {
      setDjName(currentLibrary.djName || 'DJ');
      setSlug(currentLibrary.slug || '');
      setLogoUrl(currentLibrary.logoUrl || '');
      setLogoBlob(null);
      setStartImageUrl(currentLibrary.startImageUrl || '');
      setStartImageBlob(null);
      setSocials({
        instagram: currentLibrary.socials?.instagram || '',
        tiktok: currentLibrary.socials?.tiktok || '',
        youtube: currentLibrary.socials?.youtube || '',
        facebook: currentLibrary.socials?.facebook || '',
        x: currentLibrary.socials?.x || '',
        spotify: currentLibrary.socials?.spotify || '',
        soundcloud: currentLibrary.socials?.soundcloud || '',
        mixcloud: currentLibrary.socials?.mixcloud || '',
        website: currentLibrary.socials?.website || '',
      });
      setError('');
    }
  }, [isOpen, currentLibrary]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isImageMime = selectedFile.type ? selectedFile.type.startsWith('image/') : false;
    const isImageExt = /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(selectedFile.name);

    if (!isImageMime && !isImageExt) {
      setError(t('account.invalidImage'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError(t('account.readError'));
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setError(t('account.loadImageError'));
      };
      img.onload = () => {
        const size = Math.max(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError(t('account.processImageError'));
          return;
        }
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, size, size);
        const x = (size - img.width) / 2;
        const y = (size - img.height) / 2;
        ctx.drawImage(img, x, y);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError(t('account.processImageError'));
              return;
            }
            setLogoBlob(blob);
            setLogoUrl(URL.createObjectURL(blob));
            setError('');
          },
          'image/jpeg',
          0.92
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleStartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const isImageMime = selectedFile.type ? selectedFile.type.startsWith('image/') : false;
    const isImageExt = /\.(png|jpe?g|webp|svg|gif|bmp|ico|avif)$/i.test(selectedFile.name);

    if (!isImageMime && !isImageExt) {
      setError(t('account.invalidImage'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setError(t('account.readError'));
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setError(t('account.loadImageError'));
      };
      img.onload = () => {
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError(t('account.processImageError'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError(t('account.processImageError'));
              return;
            }
            setStartImageBlob(blob);
            setStartImageUrl(URL.createObjectURL(blob));
            setError('');
          },
          'image/jpeg',
          0.9
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowProfileEdit) {
      setError(t('account.loginRequired'));
      return;
    }
    if (!djName.trim()) {
      setError(t('account.nameRequired'));
      return;
    }
    if (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim().toLowerCase())) {
      setError(t('account.slugInvalid'));
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onUpdateDetails({
        djName: djName.trim(),
        slug: slug.trim().toLowerCase() || undefined,
        logoUrl,
        logoBlob: logoBlob || undefined,
        startImageUrl,
        startImageBlob: startImageBlob || undefined,
        socials,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || t('account.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 my-auto max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800/80 text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">{t('account.title')}</h3>
              <p className="text-[11px] text-zinc-400">{t('account.subtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <form id="account-form" onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> {t('account.djName')}
                </label>
                <input
                  type="text"
                  required
                  value={djName}
                  onChange={(e) => setDjName(e.target.value)}
                  disabled={!allowProfileEdit}
                  placeholder={t('account.djNamePlaceholder')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> {t('account.slug')}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">/d/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    disabled={!allowProfileEdit}
                    placeholder="dj-alex"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 font-mono outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  {t('account.slugHint')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> {t('account.logo')}
                </label>
                <div className="flex items-center gap-3 bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl">
                  {logoUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 shrink-0 p-0.5 flex items-center justify-center">
                      <img src={logoUrl} alt="DJ Logo Preview" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 shrink-0 flex items-center justify-center text-zinc-500">
                      <Upload className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{logoUrl ? t('account.changeLogo') : t('account.chooseImage')}</span>
                      <input
                        type="file"
                        accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .bmp, .ico, .avif"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-zinc-500 block mt-1 leading-tight">
                      {t('account.logoHint')}
                    </span>
                  </div>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl('');
                        setLogoBlob(null);
                      }}
                      className="ml-auto shrink-0 p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title={t('account.removeLogo')}
                      aria-label={t('account.removeLogo')}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> {t('account.startImage')}
                </label>
                <div className="flex items-center gap-3 bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl">
                  {startImageUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 shrink-0 p-0.5 flex items-center justify-center">
                      <img
                        src={startImageUrl}
                        alt="Startpagina preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 shrink-0 flex items-center justify-center text-zinc-500">
                      <ImageIcon className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{startImageUrl ? t('account.changePhoto') : t('account.choosePhoto')}</span>
                      <input
                        type="file"
                        accept="image/*, .png, .jpg, .jpeg, .webp, .svg, .gif, .bmp, .ico, .avif"
                        onChange={handleStartImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-zinc-500 block mt-1 leading-tight">
                      {t('account.startImageHint')}
                    </span>
                  </div>

                  {startImageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartImageUrl('');
                        setStartImageBlob(null);
                      }}
                      className="ml-auto shrink-0 p-2 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors"
                      title={t('account.removeStartImage')}
                      aria-label={t('account.removeStartImage')}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" /> {t('account.socials')}
                </label>
                <div className="space-y-2 bg-zinc-950/70 border border-zinc-800 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Instagram URL:</span>
                    <input
                      type="url"
                      value={socials.instagram || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, instagram: e.target.value }))}
                      placeholder="https://instagram.com/jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">TikTok URL:</span>
                    <input
                      type="url"
                      value={socials.tiktok || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, tiktok: e.target.value }))}
                      placeholder="https://tiktok.com/@jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">YouTube URL:</span>
                    <input
                      type="url"
                      value={socials.youtube || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, youtube: e.target.value }))}
                      placeholder="https://youtube.com/@jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Facebook URL:</span>
                    <input
                      type="url"
                      value={socials.facebook || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, facebook: e.target.value }))}
                      placeholder="https://facebook.com/jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">X URL:</span>
                    <input
                      type="url"
                      value={socials.x || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, x: e.target.value }))}
                      placeholder="https://x.com/jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Spotify URL:</span>
                    <input
                      type="url"
                      value={socials.spotify || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, spotify: e.target.value }))}
                      placeholder="https://open.spotify.com/artist/..."
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">SoundCloud URL:</span>
                    <input
                      type="url"
                      value={socials.soundcloud || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, soundcloud: e.target.value }))}
                      placeholder="https://soundcloud.com/jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Mixcloud URL:</span>
                    <input
                      type="url"
                      value={socials.mixcloud || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, mixcloud: e.target.value }))}
                      placeholder="https://mixcloud.com/jouwnaam"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">Website / Linktree URL:</span>
                    <input
                      type="url"
                      value={socials.website || ''}
                      onChange={(e) => setSocials((s) => ({ ...s, website: e.target.value }))}
                      placeholder="https://jouwwebsite.nl"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={async () => {
                onClose();
                await signOut();
                navigate('/login', { replace: true });
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-800/60 hover:bg-red-950/40 text-zinc-300 hover:text-red-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> {t('common.logout')}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="submit"
            form="account-form"
            disabled={isSaving || !allowProfileEdit}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40"
          >
            {isSaving ? t('common.saving') : t('account.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
