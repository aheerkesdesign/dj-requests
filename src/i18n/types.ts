import { dictionaries, nl } from './translations';

export type Locale = 'nl' | 'en';
export type TranslationKey = keyof typeof nl;

export type TranslateFn = (
  key: TranslationKey,
  vars?: Record<string, string | number>
) => string;

export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const dict = dictionaries[locale] || dictionaries.nl;
  let text: string = dict[key] ?? dictionaries.nl[key] ?? String(key);
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
