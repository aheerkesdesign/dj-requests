import React from 'react';
import { USBLibrary } from '../types';
import { Disc3, Settings, Share2, CircleUserRound } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

interface HeaderProps {
  currentLibrary: USBLibrary | null;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onOpenShare: () => void;
  onGoToStartScreen: () => void;
  isOwner: boolean;
  activeTab: 'tracks' | 'requests' | 'dj';
  setActiveTab: (tab: 'tracks' | 'requests' | 'dj') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLibrary,
  onOpenSettings,
  onOpenAccount,
  onOpenShare,
  onGoToStartScreen,
  isOwner,
  activeTab,
  setActiveTab,
}) => {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 text-zinc-100 shadow-md">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={onGoToStartScreen}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            title={t('header.backToStart')}
          >
            {(currentLibrary?.logoUrl || '/icon.svg') ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center p-0.5 shadow-md group-hover:border-emerald-500/50 transition-colors">
                <img
                  src={currentLibrary?.logoUrl || '/icon.svg'}
                  alt={currentLibrary?.djName || 'DJ Logo'}
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-zinc-950 shadow-md shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <Disc3 className="w-6 h-6 animate-spin-slow" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold text-zinc-100 truncate leading-tight group-hover:text-emerald-400 transition-colors">
                {currentLibrary?.djName
                  ? t('header.libraryOf', { name: currentLibrary.djName })
                  : t('header.library')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleLocale}
              className="min-w-[2.25rem] px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-[11px] font-bold tracking-wide"
              title={t('common.language')}
              aria-label={t('common.language')}
            >
              {locale === 'nl' ? t('common.switchToEn') : t('common.switchToNl')}
            </button>

            <button
              onClick={onOpenShare}
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 transition-colors shadow-sm"
              title={t('header.shareTitle')}
              aria-label={t('header.shareAria')}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isOwner && (
              <>
                <button
                  onClick={onOpenSettings}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title={t('header.settingsTitle')}
                  aria-label={t('header.settingsAria')}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenAccount}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title={t('header.accountTitle')}
                  aria-label={t('header.accountAria')}
                >
                  <CircleUserRound className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <nav className="flex items-center justify-around gap-2 mt-3 border-t border-zinc-800/60 pt-2">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
              activeTab === 'tracks'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span className="truncate">{t('header.tracks')}</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
              activeTab === 'requests'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <span className="truncate">{t('header.requests')}</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveTab('dj')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center transition-all ${
                activeTab === 'dj'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
              title={t('header.djManageTitle')}
            >
              <span className="truncate">{t('header.djManage')}</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
