import { useCallback, useEffect, useRef, useState } from 'react';

export const MOTION_EXIT_MS = 150;
export const MOTION_ENTER_MS = 250;

function prefersReducedMotion() {
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

  return { present, overlayClassName, panelClassName };
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
 * The first settled value does not count, so the initial paint stays still.
 * Pass `settled: false` while the count is not yet meaningful.
 */
export function useArriveFromEmpty(count: number, settled: boolean) {
  const [prevCount, setPrevCount] = useState<number | null>(null);
  const [arriving, setArriving] = useState(false);

  if (settled && count !== prevCount) {
    const fromEmpty = prevCount === 0 && count > 0 && !prefersReducedMotion();
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
