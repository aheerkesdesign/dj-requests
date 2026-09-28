import React from 'react';
import { USBLibrary } from '../types';
import { Disc3, Music2, Globe, ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { LocaleToggle } from './LocaleToggle';
import {
  FacebookIcon,
  InstagramIcon,
  MixcloudIcon,
  SoundcloudIcon,
  SpotifyIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from './SocialIcons';

interface StartScreenProps {
  library: USBLibrary | null;
  onGoToLibrary: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ library, onGoToLibrary }) => {
  const { t } = useI18n();
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
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10 pt-2 flex justify-end">
        <LocaleToggle className="bg-zinc-900/90" />
      </div>

      <div className="my-auto py-8 w-full max-w-md flex flex-col items-center text-center z-10 space-y-8">
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

        <div className="space-y-1.5 px-2">
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 tracking-tight">
            {djName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">{t('start.welcome')}</p>
        </div>

        <div className="w-full space-y-3 px-2">
          <button
            onClick={onGoToLibrary}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer tracking-wide"
          >
            <Music2 className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
            <span>{t('start.songRequest')}</span>
          </button>
        </div>

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
