import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

export const MOTION_EXIT_MS = 150;
export const MOTION_ENTER_MS = 250;

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Keeps a portal/modal mounted through its exit animation.
 */
export function usePresence(open: boolean, exitMs = MOTION_EXIT_MS) {
  const [present, setPresent] = useState(open);
  const [phase, setPhase] = useState<'enter' | 'exit' | 'shown'>(open ? 'enter' : 'shown');

  useEffect(() => {
    if (open) {
      setPresent(true);
      setPhase(prefersReducedMotion() ? 'shown' : 'enter');
      return;
    }

    if (!present) return;

    if (prefersReducedMotion()) {
      setPresent(false);
      setPhase('shown');
      return;
    }

    setPhase('exit');
    const timer = window.setTimeout(() => {
      setPresent(false);
      setPhase('shown');
    }, exitMs);

    return () => window.clearTimeout(timer);
  }, [open, exitMs, present]);

  const overlayClassName =
    phase === 'enter'
      ? 'motion-overlay-enter'
      : phase === 'exit'
        ? 'motion-overlay-exit'
        : undefined;

  const panelClassName =
    phase === 'enter'
      ? 'motion-modal-enter'
      : phase === 'exit'
        ? 'motion-modal-exit'
        : undefined;

  return { present, phase, overlayClassName, panelClassName };
}

/**
 * Plays a list-item exit animation before running the real remove callback.
 */
export function useExitingIds(exitMs = MOTION_EXIT_MS) {
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());

  const requestExit = useCallback(
    (id: string, onDone: () => void) => {
      if (prefersReducedMotion()) {
        onDone();
        return;
      }

      setExitingIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      window.setTimeout(() => {
        onDone();
        setExitingIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, exitMs);
    },
    [exitMs]
  );

  const isExiting = useCallback((id: string) => exitingIds.has(id), [exitingIds]);

  return { exitingIds, requestExit, isExiting };
}

type ClearListPhase = 'idle' | 'await-modal' | 'list-exit' | 'empty-enter';

/**
 * After a confirm popup closes: wait for modal exit → fade list out → clear → fade empty state in.
 */
export function useClearListSequence(onClear: () => void) {
  const [phase, setPhase] = useState<ClearListPhase>('idle');
  const onClearRef = useRef(onClear);
  onClearRef.current = onClear;

  const beginAfterModalClose = useCallback(() => {
    if (prefersReducedMotion()) {
      onClearRef.current();
      setPhase('idle');
      return;
    }
    setPhase('await-modal');
  }, []);

  useEffect(() => {
    if (phase === 'await-modal') {
      const timer = window.setTimeout(() => setPhase('list-exit'), MOTION_EXIT_MS);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'list-exit') {
      const timer = window.setTimeout(() => {
        onClearRef.current();
        setPhase('empty-enter');
      }, MOTION_EXIT_MS);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'empty-enter') {
      const timer = window.setTimeout(() => setPhase('idle'), MOTION_ENTER_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  return {
    beginAfterModalClose,
    listExiting: phase === 'list-exit',
    emptyEntering: phase === 'empty-enter',
    /** True while the local clear animation is in progress (incl. waiting for the modal). */
    clearBusy: phase !== 'idle',
  };
}

/**
 * When `items` drops from non-empty to empty without a local clear sequence,
 * keep the previous snapshot on screen for a fade-out, then fade the empty state in.
 */
export function useRemoteListClear<T>(items: T[], localBusy: boolean) {
  const prevRef = useRef(items);
  const [snapshot, setSnapshot] = useState<T[] | null>(null);
  const [phase, setPhase] = useState<'idle' | 'exit' | 'empty-enter'>('idle');

  useEffect(() => {
    if (localBusy) {
      prevRef.current = items;
      if (phase !== 'idle') setPhase('idle');
      if (snapshot !== null) setSnapshot(null);
      return;
    }

    if (phase === 'idle' && prevRef.current.length > 0 && items.length === 0) {
      if (prefersReducedMotion()) {
        prevRef.current = items;
        return;
      }
      setSnapshot(prevRef.current);
      setPhase('exit');
      return;
    }

    if (phase === 'idle') {
      prevRef.current = items;
    }
  }, [items, localBusy, phase, snapshot]);

  useEffect(() => {
    if (phase === 'exit') {
      const timer = window.setTimeout(() => {
        setSnapshot(null);
        prevRef.current = [];
        setPhase('empty-enter');
      }, MOTION_EXIT_MS);
      return () => window.clearTimeout(timer);
    }

    if (phase === 'empty-enter') {
      const timer = window.setTimeout(() => setPhase('idle'), MOTION_ENTER_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  return {
    displayItems: snapshot ?? items,
    listExiting: phase === 'exit',
    emptyEntering: phase === 'empty-enter',
  };
}

/**
 * True for one enter-duration after `count` goes from 0 to at least 1.
 * The first settled value does not count when it was never held (initial paint stays still).
 * After `settled: false` (loader / meta hold), the first non-empty settle does fade in.
 * Pass `settled: false` while the count is not yet meaningful.
 */
export function useArriveFromEmpty(count: number, settled: boolean) {
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [arriving, setArriving] = useState(false);
  const wasUnsettledRef = useRef(false);

  if (!settled) {
    wasUnsettledRef.current = true;
  }

  if (settled && count !== prevCount) {
    const fromEmpty =
      !prefersReducedMotion() &&
      count > 0 &&
      (prevCount === 0 || (prevCount === null && wasUnsettledRef.current));
    wasUnsettledRef.current = false;
    setPrevCount(count);
    if (fromEmpty) setArriving(true);
    else if (count === 0) setArriving(false);
  }

  useEffect(() => {
    if (!arriving) return;
    const timer = window.setTimeout(() => setArriving(false), MOTION_ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [arriving]);

  return arriving;
}

/**
 * Tab-style list fade when the sort key changes: exit → swap order → enter.
 * `displaySortBy` lags behind during the exit so the old order stays visible.
 */
export function useSortChangeMotion<T extends string>(sortBy: T) {
  const [displaySortBy, setDisplaySortBy] = useState(sortBy);
  const [phase, setPhase] = useState<'idle' | 'exit' | 'enter'>('idle');

  useEffect(() => {
    if (sortBy === displaySortBy) return;

    if (prefersReducedMotion()) {
      setDisplaySortBy(sortBy);
      setPhase('idle');
      return;
    }

    setPhase('exit');
    const timer = window.setTimeout(() => {
      setDisplaySortBy(sortBy);
      setPhase('enter');
    }, MOTION_EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [sortBy, displaySortBy]);

  useEffect(() => {
    if (phase !== 'enter') return;
    const timer = window.setTimeout(() => setPhase('idle'), MOTION_ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const listMotionClass =
    phase === 'exit'
      ? 'motion-panel-exit'
      : phase === 'enter'
        ? 'motion-panel-enter'
        : undefined;

  return {
    displaySortBy,
    listMotionClass,
    /** True while the list is fading for a sort change (FLIP should stay off). */
    sortMotionBusy: phase !== 'idle',
  };
}

/**
 * Marks newly appearing ids for one enter-duration so callers can fade them in.
 * Skips the first snapshot and empty→non-empty bursts (those use list-level enter).
 * Multiple ids added in one update are all marked together.
 *
 * Detection runs during render so the first painted frame already has enter classes —
 * otherwise rows mount at full height, collapse to 0fr, then expand again.
 */
export function useEnteringIds(ids: string[], enabled = true) {
  const idsKey = ids.join('\0');
  const [prevIdsKey, setPrevIdsKey] = useState<string | null>(null);
  const [enteringIds, setEnteringIds] = useState<Set<string>>(() => new Set());

  let enteringThisRender = enteringIds;

  if (prevIdsKey === null) {
    setPrevIdsKey(idsKey);
  } else if (prevIdsKey !== idsKey) {
    if (!enabled) {
      // Stay in sync while list-level motion owns the screen, so we don't
      // replay inserts as individual fades when enabled again.
      setPrevIdsKey(idsKey);
    } else {
      const prevIds = prevIdsKey === '' ? [] : prevIdsKey.split('\0');
      const prevSet = new Set(prevIds);
      const added = ids.filter((id) => !prevSet.has(id));
      setPrevIdsKey(idsKey);

      // Whole-list arrive-from-empty handles the first population after clear.
      if (added.length > 0 && prevIds.length > 0 && !prefersReducedMotion()) {
        enteringThisRender = new Set(enteringIds);
        for (const id of added) enteringThisRender.add(id);
        setEnteringIds(enteringThisRender);
      }
    }
  }

  useEffect(() => {
    if (enteringIds.size === 0) return;
    const batch = [...enteringIds];
    const timer = window.setTimeout(() => {
      setEnteringIds((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (const id of batch) {
          if (next.delete(id)) changed = true;
        }
        return changed ? next : prev;
      });
    }, MOTION_ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [enteringIds]);

  const isEntering = useCallback(
    (id: string) => enteringThisRender.has(id),
    [enteringThisRender]
  );

  const markEntering = useCallback((id: string) => {
    if (prefersReducedMotion()) return;
    setEnteringIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  return { enteringIds: enteringThisRender, isEntering, markEntering };
}

/**
 * FLIP: when existing rows move (e.g. new items inserted above), animate the
 * translate instead of jumping. New rows are skipped (they fade in separately).
 *
 * Only animates when `itemIds` actually change while `animate` is true — turning
 * `animate` back on after an insert must not FLIP from stale collapsed positions.
 * Callers should keep `animate` false while CSS exit/enter row-height motion is
 * in progress; otherwise FLIP replays that shift.
 */
export function useListFlipMotion(
  containerRef: RefObject<HTMLElement | null>,
  itemIds: string[],
  animate: boolean
) {
  const prevRectsRef = useRef<Map<string, number>>(new Map());
  const prevIdsKeyRef = useRef<string | null>(null);
  const idsKey = itemIds.join('\0');

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      prevRectsRef.current = new Map();
      prevIdsKeyRef.current = idsKey;
      return;
    }

    const nodes = container.querySelectorAll<HTMLElement>('[data-list-id]');
    const nextTops = new Map<string, number>();
    for (const node of nodes) {
      const id = node.dataset.listId;
      if (!id) continue;
      nextTops.set(id, node.getBoundingClientRect().top);
    }

    const idsChanged = prevIdsKeyRef.current !== null && prevIdsKeyRef.current !== idsKey;
    prevIdsKeyRef.current = idsKey;

    const prevTops = prevRectsRef.current;
    const canAnimate =
      animate && idsChanged && prevTops.size > 0 && !prefersReducedMotion();

    if (canAnimate) {
      for (const node of nodes) {
        const id = node.dataset.listId;
        if (!id) continue;
        const first = prevTops.get(id);
        const last = nextTops.get(id);
        if (first === undefined || last === undefined) continue;
        const dy = first - last;
        if (Math.abs(dy) < 1) continue;

        node.style.transition = 'none';
        node.style.transform = `translateY(${dy}px)`;
        // Force reflow so the invert sticks before we play.
        void node.offsetHeight;
        node.style.transition = `transform var(--duration-motion-slow) var(--ease-motion)`;
        node.style.transform = '';

        const clear = () => {
          node.style.transition = '';
          node.style.transform = '';
          node.removeEventListener('transitionend', onEnd);
        };
        const onEnd = (event: TransitionEvent) => {
          if (event.target === node && event.propertyName === 'transform') clear();
        };
        node.addEventListener('transitionend', onEnd);
        window.setTimeout(clear, MOTION_ENTER_MS + 50);
      }
    }

    prevRectsRef.current = nextTops;
  }, [idsKey, animate, containerRef]);
}
