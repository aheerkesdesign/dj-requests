import React, { useEffect, useMemo, useRef } from 'react';
import { USBLibrary } from '../types';
import { Disc3, Settings, Share2, CircleUserRound, Import } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { LocaleToggle } from './LocaleToggle';
import { cn } from '@/lib/utils';

type LibraryTab = 'tracks' | 'requests' | 'dj';

interface HeaderProps {
  currentLibrary: USBLibrary | null;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onOpenShare: () => void;
  onGoToStartScreen: () => void;
  isOwner: boolean;
  /** Owner-only Downloads tab; hide when download requests are disabled. */
  showDjTab?: boolean;
  activeTab: LibraryTab;
  setActiveTab: (tab: LibraryTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLibrary,
  onOpenImport,
  onOpenSettings,
  onOpenAccount,
  onOpenShare,
  onGoToStartScreen,
  isOwner,
  showDjTab = true,
  activeTab,
  setActiveTab,
}) => {
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--app-header-height',
        `${el.offsetHeight}px`
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--app-header-height');
    };
  }, []);

  const tabs = useMemo(() => {
    const base: { id: LibraryTab; label: string; title?: string }[] = [
      { id: 'tracks', label: t('header.tracks') },
      { id: 'requests', label: t('header.requests') },
    ];
    if (isOwner && showDjTab) {
      base.push({
        id: 'dj',
        label: t('header.djManage'),
        title: t('header.djManageTitle'),
      });
    }
    return base;
  }, [isOwner, showDjTab, t]);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeTab)
  );
  const tabCount = tabs.length;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 border-b border-border/80 bg-background/95 px-4 py-3 text-foreground backdrop-blur-md"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-2">
          <div
            onClick={isOwner ? undefined : onGoToStartScreen}
            className={cn(
              'group flex min-w-0 items-center gap-2.5',
              !isOwner && 'motion-press cursor-pointer'
            )}
            title={isOwner ? undefined : t('header.backToStart')}
          >
            {(currentLibrary?.logoUrl || '/favicon.png') ? (
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-0.5',
                  !isOwner && 'motion-colors group-hover:border-primary/40'
                )}
              >
                <img
                  src={currentLibrary?.logoUrl || '/favicon.png'}
                  alt={currentLibrary?.djName || 'DJ-logo'}
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
            ) : (
              <div
                className={cn(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground',
                  !isOwner && 'transition-transform group-hover:scale-105'
                )}
              >
                <Disc3 className="h-6 w-6 animate-spin-slow" />
              </div>
            )}
            <div className="min-w-0">
              <h1
                className={cn(
                  'truncate font-heading text-base font-bold leading-tight tracking-tight text-foreground',
                  !isOwner && 'motion-colors group-hover:text-primary'
                )}
              >
                {currentLibrary?.djName
                  ? t('header.libraryOf', { name: currentLibrary.djName })
                  : t('header.library')}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {!isOwner && <LocaleToggle />}

            <button
              onClick={onOpenShare}
              className="motion-colors rounded-lg border border-border bg-card p-2 text-primary hover:bg-secondary"
              title={t('header.shareTitle')}
              aria-label={t('header.shareAria')}
            >
              <Share2 className="h-4 w-4" />
            </button>

            {isOwner && (
              <>
                <button
                  onClick={onOpenImport}
                  className="motion-colors rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title={t('header.importTitle')}
                  aria-label={t('header.importAria')}
                >
                  <Import className="h-4 w-4" />
                </button>
                <button
                  onClick={onOpenSettings}
                  className="motion-colors rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title={t('header.settingsTitle')}
                  aria-label={t('header.settingsAria')}
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={onOpenAccount}
                  className="motion-colors rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  title={t('header.accountTitle')}
                  aria-label={t('header.accountAria')}
                >
                  <CircleUserRound className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <nav
          className="relative mt-3 grid rounded-xl border border-border/80 bg-card p-1"
          style={{ gridTemplateColumns: `repeat(${tabCount}, minmax(0, 1fr))` }}
        >
          <div
            aria-hidden
            className="motion-tab-indicator pointer-events-none absolute top-1 bottom-1 left-1 z-0 rounded-lg border border-primary/40 bg-secondary"
            style={{
              width: `calc((100% - 0.5rem) / ${tabCount})`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.title}
                className={cn(
                  'relative z-10 flex items-center justify-center rounded-lg px-3 py-2 font-heading text-sm font-semibold motion-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
