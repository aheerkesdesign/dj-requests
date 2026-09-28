import React from 'react';
import { Search, X, ArrowUpDown, Check } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { cn } from '@/lib/utils';

export interface SortMenuOption {
  value: string;
  label: string;
  title?: string;
}

interface SearchBarAndFiltersProps {
  searchQuery: string;
  onSearchChange: (searchQuery: string) => void;
  /** When set, shows a sort button with a fade-in options menu. */
  sortMenu?: {
    value: string;
    options: SortMenuOption[];
    onChange: (value: string) => void;
  };
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortMenu,
}) => {
  const { t } = useI18n();
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sortOpen]);

  const activeSortLabel =
    sortMenu?.options.find((o) => o.value === sortMenu.value)?.label ?? t('search.sortBy');

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="search-glow relative flex-1 rounded-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-11 w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-sm text-foreground outline-none motion-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground motion-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {sortMenu && (
          <div ref={sortRef} className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((open) => !open)}
              className={cn(
                'motion-colors flex h-11 items-center gap-1.5 rounded-xl border bg-card px-3.5 text-sm font-medium text-foreground hover:border-secondary hover:text-primary',
                sortOpen ? 'border-primary/40 text-primary' : 'border-border'
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline text-muted-foreground">{t('search.sortBy')}</span>
              <span className="max-w-[7rem] truncate sm:max-w-[9rem]">{activeSortLabel}</span>
            </button>

            {sortOpen && (
              <div
                role="listbox"
                className="motion-panel-enter absolute right-0 z-30 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
              >
                {sortMenu.options.map((option) => {
                  const selected = option.value === sortMenu.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      title={option.title}
                      onClick={() => {
                        sortMenu.onChange(option.value);
                        setSortOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm motion-colors',
                        selected
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-secondary hover:text-primary'
                      )}
                    >
                      <span>{option.label}</span>
                      {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
