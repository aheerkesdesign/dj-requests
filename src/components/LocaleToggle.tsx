import { useI18n } from '../i18n/LanguageContext';

interface LocaleToggleProps {
  className?: string;
}

/** Shows the locale the user can switch to (NL ↔ EN). */
export function LocaleToggle({ className = '' }: LocaleToggleProps) {
  const { locale, toggleLocale, t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`min-w-[2.25rem] px-2 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-[11px] font-bold tracking-wide ${className}`.trim()}
      title={t('common.language')}
      aria-label={t('common.language')}
    >
      {locale === 'nl' ? t('common.switchToNl') : t('common.switchToEn')}
    </button>
  );
}
