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
  totalTracksCount?: number;
  filteredTracksCount?: number;
  onOpenRequestModal?: () => void;
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-2.5">
      {/* Search Input & Sort Selector Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            placeholder={t('search.placeholder')}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort button */}
        <button
          onClick={() =>
            onFilterChange({
              sortBy: filters.sortBy === 'title' ? 'artist' : 'title'
            })
          }
          className="px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all"
          title={filters.sortBy === 'title' ? t('search.sortByTitle') : t('search.sortByArtist')}
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">{t('search.sortBy')}</span>
          <span className="text-emerald-300 capitalize">
            {filters.sortBy === 'title' ? t('search.sortTitle') : t('search.sortArtist')}
          </span>
        </button>
      </div>
    </div>
  );
};

