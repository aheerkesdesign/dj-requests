import React from 'react';
import { Search, X, ArrowUpDown } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';

interface FilterState {
  searchQuery: string;
  sortBy: 'title' | 'artist';
  sortOrder: 'asc' | 'desc';
}

interface SearchBarAndFiltersProps {
  filters: FilterState;
  onFilterChange: (updated: Partial<FilterState>) => void;
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="search-glow relative flex-1 rounded-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            placeholder={t('search.placeholder')}
            className="h-11 w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-9 text-sm text-foreground outline-none motion-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/40"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground motion-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() =>
            onFilterChange({
              sortBy: filters.sortBy === 'title' ? 'artist' : 'title'
            })
          }
          className="motion-colors flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground hover:border-secondary hover:text-primary"
          title={filters.sortBy === 'title' ? t('search.sortByTitle') : t('search.sortByArtist')}
        >
          <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline text-muted-foreground">{t('search.sortBy')}</span>
          <span className="capitalize">
            {filters.sortBy === 'title' ? t('search.sortTitle') : t('search.sortArtist')}
          </span>
        </button>
      </div>
    </div>
  );
};
