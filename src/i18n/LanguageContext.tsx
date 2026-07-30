import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries } from './translations';
import { Locale, TranslationKey, TranslateFn, translate } from './types';

const STORAGE_KEY = 'dj_requests_locale';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: TranslateFn;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'nl';
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'nl' ? stored : 'nl';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
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
export { dictionaries };
