import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Locale, TranslationKey, TranslateFn, translate } from './types';

/** Current storage key; legacy `dj_requests_locale` is migrated once. */
export const LOCALE_STORAGE_KEY = 'trackdrop_locale';
const LEGACY_LOCALE_STORAGE_KEY = 'dj_requests_locale';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'nl';
  const stored =
    localStorage.getItem(LOCALE_STORAGE_KEY) ?? localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'nl') {
    if (!localStorage.getItem(LOCALE_STORAGE_KEY)) {
      localStorage.setItem(LOCALE_STORAGE_KEY, stored);
      localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
    }
    return stored;
  }
  return 'nl';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    localStorage.removeItem(LEGACY_LOCALE_STORAGE_KEY);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => setLocaleState(next);
  const toggleLocale = () => setLocaleState((prev) => (prev === 'nl' ? 'en' : 'nl'));

  const t: TranslateFn = useMemo(
    () => (key, vars) => translate(locale, key, vars),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider');
  return ctx;
}

export type { Locale, TranslationKey };
