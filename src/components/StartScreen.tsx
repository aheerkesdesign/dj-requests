import React from 'react';
import { USBLibrary } from '../types';
import { Disc3, Music2, Globe, ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

interface StartScreenProps {
  library: USBLibrary | null;
  onGoToLibrary: () => void;
}

// Custom brand icons for popular socials
const InstagramIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.899 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.019zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const SoundcloudIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M1.175 12.225c-.071 0-.131.022-.18.069-.048.048-.071.108-.071.179v6.027c0 .071.023.131.071.179.049.048.109.072.18.072h.001c.071 0 .131-.024.18-.072.048-.048.071-.108.071-.179v-6.027c0-.071-.023-.131-.071-.179-.049-.047-.109-.069-.181-.069zm1.411-1.391c-.071 0-.131.024-.18.072-.048.048-.071.108-.071.179v7.418c0 .071.023.131.071.179.049.048.109.072.18.072s.131-.024.18-.072c.048-.048.071-.108.071-.179v-7.418c0-.071-.023-.131-.071-.179-.049-.048-.109-.072-.18-.072zm1.412-.835c-.071 0-.131.024-.18.072-.048.048-.071.108-.071.179v8.253c0 .071.023.131.071.179.049.048.109.072.18.072s.131-.024.18-.072c.048-.048.071-.108.071-.179v-8.253c0-.071-.023-.131-.071-.179-.049-.048-.109-.072-.18-.072zm1.411-.557c-.071 0-.131.024-.18.072-.048.048-.071.108-.071.179v8.81c0 .071.023.131.071.179.049.048.109.072.18.072s.131-.024.18-.072c.048-.048.071-.108.071-.179v-8.81c0-.071-.023-.131-.071-.179-.049-.048-.109-.072-.18-.072zm1.412-.139c-.071 0-.131.024-.18.072-.048.048-.071.108-.071.179v8.949c0 .071.023.131.071.179.049.048.109.072.18.072s.131-.024.18-.072c.048-.048.071-.108.071-.179v-8.949c0-.071-.023-.131-.071-.179-.049-.048-.109-.072-.18-.072zm1.412.139c-.071 0-.131.024-.18.072-.048.048-.071.108-.071.179v8.81c0 .071.023.131.071.179.049.048.109.072.18.072s.131-.024.18-.072c.048-.048.071-.108.071-.179v-8.81c0-.071-.023-.131-.071-.179-.049-.048-.109-.072-.18-.072zm1.412.371c-.071 0-.131.024-.18.072-.048.048-.071.108-.071.179v8.439c0 .071.023.131.071.179.049.048.109.072.18.072s.131-.024.18-.072c.048-.048.071-.108.071-.179v-8.439c0-.071-.023-.131-.071-.179-.049-.048-.109-.072-.18-.072zm11.396 2.366c-.503 0-.992.091-1.448.27-.37-.899-.974-1.677-1.748-2.253-.773-.576-1.688-.888-2.645-.902-.821 0-1.632.222-2.348.643-.715.421-1.298 1.018-1.686 1.728-.052.095-.125.176-.213.237-.089.061-.19.098-.297.108l-.208.021v8.889c0 .071.023.131.071.179.049.048.109.072.18.072h10.344c.828 0 1.622-.329 2.208-.915.586-.586.915-1.38.915-2.208 0-.828-.329-1.622-.915-2.208-.586-.586-1.38-.915-2.208-.915z"/>
  </svg>
);

const MixcloudIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M2.18 11.02h1.02v6.96H2.18zm2.04 0h1.02v6.96H4.22zm2.04 0h1.02v6.96H6.26zm2.04-.84h1.02v7.8H8.3zm2.04.42h1.02v7.38h-1.02zm2.04-.42h1.02v7.8h-1.02zm2.04.84h1.02v6.96h-1.02zm7.74-1.5c-1.02 0-1.92.42-2.58 1.08-.48-.9-1.44-1.5-2.52-1.5-.36 0-.72.06-1.02.18-.54-1.44-1.92-2.46-3.54-2.46H2.18C.96 7.92 0 8.88 0 10.08v8.04c0 1.2.96 2.16 2.18 2.16h13.86c2.16 0 3.96-1.8 3.96-3.96s-1.8-3.96-3.96-3.96z"/>
  </svg>
);

export const StartScreen: React.FC<StartScreenProps> = ({
  library,
  onGoToLibrary,
}) => {
  const { t, locale, toggleLocale } = useI18n();
  const djName = library?.djName || 'DJ';
  const startImageUrl = library?.startImageUrl;
  const socials = library?.socials || {};

  const hasSocials = Boolean(
    socials.instagram ||
    socials.tiktok ||
    socials.youtube ||
    socials.facebook ||
    socials.x ||
    socials.spotify ||
    socials.soundcloud ||
    socials.mixcloud ||
    socials.website
  );

  return (
    <div className="relative min-h-[88vh] flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden select-none">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 pt-2 flex justify-end">
        <button
          type="button"
          onClick={toggleLocale}
          className="min-w-[2.25rem] px-2 py-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-[11px] font-bold tracking-wide"
          title={t('common.language')}
          aria-label={t('common.language')}
        >
          {locale === 'nl' ? t('common.switchToNl') : t('common.switchToEn')}
        </button>
      </div>

      {/* Main Center Content Section */}
      <div className="my-auto py-8 w-full max-w-md flex flex-col items-center text-center z-10 space-y-8">
        
        {/* Start page image */}
        <div className="relative group w-full max-w-sm">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
          
          <div className="relative w-full aspect-[4/3] rounded-3xl bg-zinc-900 border border-zinc-800 p-2 shadow-2xl flex items-center justify-center overflow-hidden bg-zinc-950/80 backdrop-blur-sm">
            {startImageUrl ? (
              <img
                src={startImageUrl}
                alt={djName}
                className="w-full h-full object-cover rounded-2xl shadow-inner"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-950 via-zinc-900 to-cyan-950 flex flex-col items-center justify-center p-6 border border-emerald-500/20">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
                  <Disc3 className="w-12 h-12 animate-spin-slow" />
                </div>
                <span className="text-xl font-extrabold text-zinc-100 tracking-tight leading-tight">
                  {djName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* DJ Title & Welcome Subtitle */}
        <div className="space-y-1.5 px-2">
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 tracking-tight">
            {djName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            {t('start.welcome')}
          </p>
        </div>

        {/* Song Request Button */}
        <div className="w-full space-y-3 px-2">
          <button
            onClick={onGoToLibrary}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer tracking-wide"
          >
            <Music2 className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            <span>{t('start.songRequest')}</span>
          </button>
        </div>

        {/* Socials Buttons Section */}
        {hasSocials && (
          <div className="w-full space-y-2.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
              {t('start.followSocials')}
            </span>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 border border-zinc-800 hover:border-pink-500/50 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <InstagramIcon />
                  <span>Instagram</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.tiktok && (
                <a
                  href={socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <TikTokIcon />
                  <span>TikTok</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.youtube && (
                <a
                  href={socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-red-600 border border-zinc-800 hover:border-red-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <YouTubeIcon />
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.facebook && (
                <a
                  href={socials.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-blue-600 border border-zinc-800 hover:border-blue-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <FacebookIcon />
                  <span>Facebook</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.x && (
                <a
                  href={socials.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-100 border border-zinc-800 hover:border-zinc-300 text-zinc-300 hover:text-zinc-950 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <XIcon />
                  <span>X</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.spotify && (
                <a
                  href={socials.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-emerald-600 border border-zinc-800 hover:border-emerald-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <SpotifyIcon />
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.soundcloud && (
                <a
                  href={socials.soundcloud}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-orange-600 border border-zinc-800 hover:border-orange-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <SoundcloudIcon />
                  <span>SoundCloud</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.mixcloud && (
                <a
                  href={socials.mixcloud}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-sky-600 border border-zinc-800 hover:border-sky-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <MixcloudIcon />
                  <span>Mixcloud</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}

              {socials.website && (
                <a
                  href={socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-cyan-600 border border-zinc-800 hover:border-cyan-500 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
