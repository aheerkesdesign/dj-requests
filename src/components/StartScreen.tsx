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
      <div className="w-full max-w-2xl z-10 pt-2 flex justify-end">
        <LocaleToggle className="bg-card/90" />
      </div>

      <div className="my-auto py-8 w-full max-w-md flex flex-col items-center text-center z-10 space-y-8">
        <div className="relative w-full max-w-sm">
          <div className="relative w-full aspect-[4/3] rounded-3xl bg-card border border-border p-2 shadow-2xl flex items-center justify-center overflow-hidden ring-1 ring-primary/30">
            {startImageUrl ? (
              <img
                src={startImageUrl}
                alt={djName}
                className="w-full h-full object-cover rounded-2xl shadow-inner"
              />
            ) : (
              <div className="w-full h-full rounded-2xl bg-muted flex flex-col items-center justify-center p-6 border border-border">
                <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-3">
                  <Disc3 className="w-12 h-12 animate-spin-slow" />
                </div>
                <span className="font-heading text-xl font-bold text-foreground tracking-tight leading-tight">
                  {djName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5 px-2">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {djName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('start.welcome')}</p>
        </div>

        <div className="w-full space-y-3 px-2">
          <button
            onClick={onGoToLibrary}
            className="font-heading w-full py-4 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base flex items-center justify-center gap-3 cursor-pointer tracking-wide"
          >
            <Music2 className="w-5 h-5 text-primary-foreground stroke-[2.5]" />
            <span>{t('start.songRequest')}</span>
          </button>
        </div>

        {hasSocials && (
          <div className="w-full space-y-2.5 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              {t('start.followSocials')}
            </span>
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-gradient-to-r hover:from-pink-600 hover:to-purple-600 border border-border hover:border-pink-500/50 text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-secondary border border-border hover:border-border text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-red-600 border border-border hover:border-red-500 text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-blue-600 border border-border hover:border-blue-500 text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-foreground border border-border hover:border-border text-foreground hover:text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-emerald-600 border border-border hover:border-primary/40 text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-orange-600 border border-border hover:border-orange-500 text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-sky-600 border border-border hover:border-sky-500 text-foreground hover:text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
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
                  className="px-3.5 py-2 rounded-xl bg-card/90 hover:bg-primary border border-border hover:border-primary/40 text-foreground hover:text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Globe className="w-4 h-4 text-primary" />
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
