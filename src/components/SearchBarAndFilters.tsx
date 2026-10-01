import React from 'react';
import { Search, X, ArrowUpDown, Check, ListFilter } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { usePresence } from '../hooks/useMotionPresence';
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
  /** When set, shows an action button beside the search bar (e.g. playlist filter). */
  actionButton?: {
    label: string;
    onClick: () => void;
    /** Visually emphasize when a non-default filter is active. */
    active?: boolean;
    title?: string;
  };
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export const SearchBarAndFilters: React.FC<SearchBarAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  sortMenu,
  actionButton,
}) => {
  const { t } = useI18n();
  const [sortOpen, setSortOpen] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const sortButtonRef = React.useRef<HTMLButtonElement>(null);
  const searchFieldRef = React.useRef<HTMLDivElement>(null);
  const [useShortPlaceholder, setUseShortPlaceholder] = React.useState(false);
  const { present: sortPresent, panelClassName: sortMenuMotionClass } = usePresence(sortOpen);

  React.useEffect(() => {
    const el = searchFieldRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = (width: number) => {
      // Long placeholder needs ~220px of input width after icon/padding.
      setUseShortPlaceholder(width < 220);
    };
    update(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (typeof width === 'number') update(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const activeSortLabel =
    sortMenu?.options.find((o) => o.value === sortMenu.value)?.label ?? t('search.sortBy');

  const [displayLabel, setDisplayLabel] = React.useState(activeSortLabel);
  const [labelAnimKey, setLabelAnimKey] = React.useState(0);
  const [labelAnimating, setLabelAnimating] = React.useState(false);
  const [buttonConfirm, setButtonConfirm] = React.useState(false);
  /** Label to reveal on the button after the options menu finishes fading out. */
  const pendingLabelRef = React.useRef<string | null>(null);
  const wasMenuPresentRef = React.useRef(false);
  /** Capture button width before the label swap so we can tween to the new size. */
  const widthFromRef = React.useRef<number | null>(null);

  const animateLabelTo = React.useCallback((next: string) => {
    if (!prefersReducedMotion()) {
      widthFromRef.current = sortButtonRef.current?.getBoundingClientRect().width ?? null;
    }
    setDisplayLabel(next);
    setLabelAnimKey((k) => k + 1);
    setLabelAnimating(true);
    setButtonConfirm(true);
  }, []);

  React.useLayoutEffect(() => {
    const btn = sortButtonRef.current;
    const from = widthFromRef.current;
    widthFromRef.current = null;
    if (!btn || from === null || prefersReducedMotion()) return;

    const to = btn.getBoundingClientRect().width;
    if (Math.abs(to - from) < 1) return;
    // Growing from a short label to a long one: don't tween from the old
    // narrow width — that clips/truncates the new word mid-transition.
    if (to > from) return;

    btn.style.width = `${from}px`;
    void btn.offsetWidth;
    btn.style.transition = 'width var(--duration-motion-slow) var(--ease-motion)';
    btn.style.width = `${to}px`;

    const clear = () => {
      btn.style.width = '';
      btn.style.transition = '';
      btn.removeEventListener('transitionend', onEnd);
    };
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'width') clear();
    };
    btn.addEventListener('transitionend', onEnd);
    const fallback = window.setTimeout(clear, 300);
    return () => {
      window.clearTimeout(fallback);
      btn.removeEventListener('transitionend', onEnd);
      btn.style.width = '';
      btn.style.transition = '';
    };
  }, [displayLabel, labelAnimKey]);

  // After options fade out, reveal the newly selected sort on the button.
  React.useEffect(() => {
    const wasPresent = wasMenuPresentRef.current;
    wasMenuPresentRef.current = sortPresent;

    if (wasPresent && !sortPresent && pendingLabelRef.current !== null) {
      const next = pendingLabelRef.current;
      pendingLabelRef.current = null;
      if (next !== displayLabel) animateLabelTo(next);
      return;
    }

    // Locale / external updates when the menu is closed.
    if (!sortPresent && pendingLabelRef.current === null && activeSortLabel !== displayLabel) {
      setDisplayLabel(activeSortLabel);
    }
  }, [sortPresent, activeSortLabel, displayLabel, animateLabelTo]);

  React.useEffect(() => {
    if (!labelAnimating && !buttonConfirm) return;
    const timer = window.setTimeout(() => {
      setLabelAnimating(false);
      setButtonConfirm(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [labelAnimating, buttonConfirm, labelAnimKey]);

  React.useEffect(() => {
    if (!sortOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) {
        pendingLabelRef.current = null;
        setSortOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pendingLabelRef.current = null;
        setSortOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sortOpen]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div ref={searchFieldRef} className="search-glow relative flex-1 rounded-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              useShortPlaceholder ? t('search.placeholderShort') : t('search.placeholder')
            }
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

        {actionButton && (
          <button
            type="button"
            onClick={actionButton.onClick}
            title={actionButton.title}
            className={cn(
              'motion-colors flex h-11 shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border bg-card px-3.5 text-sm font-medium text-foreground hover:border-secondary hover:text-primary',
              actionButton.active ? 'border-primary/40 text-primary' : 'border-border'
            )}
          >
            <ListFilter className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="whitespace-nowrap">{actionButton.label}</span>
          </button>
        )}

        {sortMenu && (
          <div ref={sortRef} className="relative shrink-0">
            <button
              ref={sortButtonRef}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((open) => !open)}
              className={cn(
                'motion-colors flex h-11 items-center gap-1.5 overflow-hidden rounded-xl border bg-card px-3.5 text-sm font-medium text-foreground hover:border-secondary hover:text-primary',
                sortOpen || sortPresent ? 'border-primary/40 text-primary' : 'border-border',
                buttonConfirm && 'motion-request-confirm'
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="hidden shrink-0 sm:inline text-muted-foreground">{t('search.sortBy')}</span>
              <span
                key={labelAnimKey}
                className={cn(
                  'inline-block whitespace-nowrap',
                  labelAnimating && 'motion-sort-label'
                )}
              >
                {displayLabel}
              </span>
            </button>

            {sortPresent && (
              <div
                role="listbox"
                className={cn(
                  'absolute right-0 z-30 mt-1.5 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg',
                  sortMenuMotionClass === 'motion-modal-enter' && 'motion-panel-enter',
                  sortMenuMotionClass === 'motion-modal-exit' && 'motion-panel-exit'
                )}
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
                        if (option.value !== sortMenu.value) {
                          pendingLabelRef.current = option.label;
                          sortMenu.onChange(option.value);
                        } else {
                          pendingLabelRef.current = null;
                        }
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
