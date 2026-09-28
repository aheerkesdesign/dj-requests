import { useEffect, useRef, useState } from 'react';

const EXIT_MS = 150;

/**
 * Delays tab content swap so the outgoing panel can fade out,
 * then the incoming panel fades in from the top.
 * Skips animation on the initial mount.
 */
export function useTabPanelMotion<T extends string>(activeTab: T) {
  const [displayTab, setDisplayTab] = useState(activeTab);
  const [phase, setPhase] = useState<'idle' | 'enter' | 'exit'>('idle');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (activeTab === displayTab) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplayTab(activeTab);
      setPhase('idle');
      return;
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setDisplayTab(activeTab);
      setPhase('idle');
      return;
    }

    setPhase('exit');
    const timer = window.setTimeout(() => {
      setDisplayTab(activeTab);
      setPhase('enter');
    }, EXIT_MS);

    return () => window.clearTimeout(timer);
  }, [activeTab, displayTab]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const panelClassName =
    phase === 'exit'
      ? 'motion-panel-exit'
      : phase === 'enter'
        ? 'motion-panel-enter'
        : undefined;

  return { displayTab, panelClassName };
}
