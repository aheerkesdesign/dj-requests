import { useI18n } from '../i18n/LanguageContext';
import { cn } from '@/lib/utils';

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
      className={cn(
        'motion-colors min-w-[2.25rem] rounded-lg border border-border bg-card px-2.5 py-2 font-heading text-xs font-semibold tracking-wide text-muted-foreground hover:bg-secondary hover:text-foreground',
        className
      )}
      title={t('common.language')}
      aria-label={t('common.language')}
    >
      {locale === 'nl' ? t('common.switchToNl') : t('common.switchToEn')}
    </button>
  );
}
