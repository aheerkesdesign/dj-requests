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
  };
}
