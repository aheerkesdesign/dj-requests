import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MOTION_ENTER_MS,
  MOTION_EXIT_MS,
  useArriveFromEmpty,
  useEnteringIds,
  useExitHold,
  useRemoteListClear,
  useSortChangeMotion,
  useSwapMotion,
} from './useMotionPresence';

function ArriveProbe({ count, settled = true }: { count: number; settled?: boolean }) {
  const arriving = useArriveFromEmpty(count, settled);
  return createElement('div', { 'data-arriving': arriving ? 'yes' : 'no' });
}

function RemoteProbe({
  items,
  localBusy = false,
}: {
  items: string[];
  localBusy?: boolean;
}) {
  const { displayItems, listExiting, emptyEntering } = useRemoteListClear(items, localBusy);
  return createElement('div', {
    'data-count': String(displayItems.length),
    'data-exiting': listExiting ? 'yes' : 'no',
    'data-empty-enter': emptyEntering ? 'yes' : 'no',
  });
}

function SortProbe({ sortBy }: { sortBy: string }) {
  const { displaySortBy, listMotionClass, sortMotionBusy } = useSortChangeMotion(sortBy);
  return createElement('div', {
    'data-display': displaySortBy,
    'data-class': listMotionClass ?? '',
    'data-busy': sortMotionBusy ? 'yes' : 'no',
  });
}

function EnteringProbe({ ids, enabled = true }: { ids: string[]; enabled?: boolean }) {
  const { isEntering } = useEnteringIds(ids, enabled);
  return createElement(
    'div',
    null,
    ...ids.map((id) =>
      createElement('span', {
        key: id,
        'data-id': id,
        'data-entering': isEntering(id) ? 'yes' : 'no',
      })
    )
  );
}

describe('useArriveFromEmpty', () => {
  let root: Root | undefined;
  let el: HTMLDivElement | undefined;

  afterEach(() => {
    act(() => root?.unmount());
    el?.remove();
    root = undefined;
    el = undefined;
  });

  function render(count: number, settled = true) {
    if (!el) {
      el = document.createElement('div');
      document.body.appendChild(el);
      root = createRoot(el);
    }
    act(() => {
      root!.render(createElement(ArriveProbe, { count, settled }));
    });
    return el.querySelector('[data-arriving]')?.getAttribute('data-arriving');
  }

  it('stays still on the first settled count', () => {
    expect(render(4)).toBe('no');
  });

  it('arrives when the count goes from empty to the first item', () => {
    expect(render(0)).toBe('no');
    expect(render(1)).toBe('yes');
  });

  it('arrives after a loading hold when the first items appear', () => {
    expect(render(0, false)).toBe('no');
    expect(render(2, true)).toBe('yes');
  });

  it('can arrive again after the list is cleared', () => {
    expect(render(0)).toBe('no');
    expect(render(1)).toBe('yes');
    expect(render(0)).toBe('no');
    expect(render(2)).toBe('yes');
  });
});

describe('useRemoteListClear', () => {
  let root: Root | undefined;
  let el: HTMLDivElement | undefined;

  afterEach(() => {
    vi.useRealTimers();
    act(() => root?.unmount());
    el?.remove();
    root = undefined;
    el = undefined;
  });

  function render(items: string[], localBusy = false) {
    if (!el) {
      el = document.createElement('div');
      document.body.appendChild(el);
      root = createRoot(el);
    }
    act(() => {
      root!.render(createElement(RemoteProbe, { items, localBusy }));
    });
    const node = el.querySelector('[data-count]');
    return {
      count: node?.getAttribute('data-count'),
      exiting: node?.getAttribute('data-exiting'),
      emptyEnter: node?.getAttribute('data-empty-enter'),
    };
  }

  it('keeps the previous list while fading out a remote clear', () => {
    vi.useFakeTimers();
    expect(render(['a', 'b'])).toMatchObject({ count: '2', exiting: 'no' });
    expect(render([])).toMatchObject({ count: '2', exiting: 'yes', emptyEnter: 'no' });

    act(() => {
      vi.advanceTimersByTime(MOTION_EXIT_MS);
    });
    expect(render([])).toMatchObject({ count: '0', exiting: 'no', emptyEnter: 'yes' });
  });

  it('does not animate when a local clear sequence is already busy', () => {
    expect(render(['a'], true)).toMatchObject({ count: '1', exiting: 'no' });
    expect(render([], true)).toMatchObject({ count: '0', exiting: 'no', emptyEnter: 'no' });
  });
});

describe('useSortChangeMotion', () => {
  let root: Root | undefined;
  let el: HTMLDivElement | undefined;

  afterEach(() => {
    vi.useRealTimers();
    act(() => root?.unmount());
    el?.remove();
    root = undefined;
    el = undefined;
  });

  function render(sortBy: string) {
    if (!el) {
      el = document.createElement('div');
      document.body.appendChild(el);
      root = createRoot(el);
    }
    act(() => {
      root!.render(createElement(SortProbe, { sortBy }));
    });
    const node = el.querySelector('[data-display]');
    return {
      display: node?.getAttribute('data-display'),
      className: node?.getAttribute('data-class'),
      busy: node?.getAttribute('data-busy'),
    };
  }

  it('keeps the previous sort visible while fading out', () => {
    vi.useFakeTimers();
    expect(render('order')).toMatchObject({ display: 'order', className: '', busy: 'no' });
    expect(render('title')).toMatchObject({
      display: 'order',
      className: 'motion-panel-exit',
      busy: 'yes',
    });

    act(() => {
      vi.advanceTimersByTime(MOTION_EXIT_MS);
    });
    expect(render('title')).toMatchObject({
      display: 'title',
      className: 'motion-panel-enter',
      busy: 'yes',
    });

    act(() => {
      vi.advanceTimersByTime(MOTION_ENTER_MS);
    });
    expect(render('title')).toMatchObject({ display: 'title', className: '', busy: 'no' });
  });
});

describe('useSwapMotion', () => {
  let root: Root | undefined;
  let el: HTMLDivElement | undefined;

  afterEach(() => {
    vi.useRealTimers();
    act(() => root?.unmount());
    el?.remove();
    root = undefined;
    el = undefined;
  });

  function SwapProbe({ value }: { value: string }) {
    const { displayValue, motionClass, busy } = useSwapMotion(value);
    return createElement('div', {
      'data-display': displayValue,
      'data-class': motionClass ?? '',
      'data-busy': busy ? 'yes' : 'no',
    });
  }

  function render(value: string) {
    if (!el) {
      el = document.createElement('div');
      document.body.appendChild(el);
      root = createRoot(el);
    }
    act(() => {
      root!.render(createElement(SwapProbe, { value }));
    });
    const node = el.querySelector('[data-display]');
    return {
      display: node?.getAttribute('data-display'),
      className: node?.getAttribute('data-class'),
      busy: node?.getAttribute('data-busy'),
    };
  }

  it('keeps the previous value visible while fading out', () => {
    vi.useFakeTimers();
    expect(render('a')).toMatchObject({ display: 'a', className: '', busy: 'no' });
    expect(render('b')).toMatchObject({
      display: 'a',
      className: 'motion-panel-exit',
      busy: 'yes',
    });

    act(() => {
      vi.advanceTimersByTime(MOTION_EXIT_MS);
    });
    expect(render('b')).toMatchObject({
      display: 'b',
      className: 'motion-panel-enter',
      busy: 'yes',
    });
  });
});

describe('useExitHold', () => {
  let root: Root | undefined;
  let el: HTMLDivElement | undefined;

  afterEach(() => {
    vi.useRealTimers();
    act(() => root?.unmount());
    el?.remove();
    root = undefined;
    el = undefined;
  });

  function ExitProbe({ items, visible }: { items: string[]; visible: boolean }) {
    const { displayItems, holding } = useExitHold(items, visible);
    return createElement('div', {
      'data-count': String(displayItems.length),
      'data-holding': holding ? 'yes' : 'no',
      'data-ids': displayItems.join(','),
    });
  }

  function render(items: string[], visible: boolean) {
    if (!el) {
      el = document.createElement('div');
      document.body.appendChild(el);
      root = createRoot(el);
    }
    act(() => {
      root!.render(createElement(ExitProbe, { items, visible }));
    });
    const node = el.querySelector('[data-count]');
    return {
      count: node?.getAttribute('data-count'),
      holding: node?.getAttribute('data-holding'),
      ids: node?.getAttribute('data-ids'),
    };
  }

  it('holds the last items through an exit when hidden', () => {
    vi.useFakeTimers();
    expect(render(['a', 'b'], true)).toMatchObject({
      count: '2',
      holding: 'no',
      ids: 'a,b',
    });
    expect(render([], false)).toMatchObject({
      count: '2',
      holding: 'yes',
      ids: 'a,b',
    });

    act(() => {
      vi.advanceTimersByTime(MOTION_EXIT_MS);
    });
    expect(render([], false)).toMatchObject({
      count: '0',
      holding: 'no',
      ids: '',
    });
  });

  it('cancels the hold when items become visible again', () => {
    vi.useFakeTimers();
    render(['a'], true);
    expect(render([], false)).toMatchObject({ holding: 'yes', ids: 'a' });
    expect(render(['a', 'b'], true)).toMatchObject({
      holding: 'no',
      ids: 'a,b',
    });
  });
});

describe('useEnteringIds', () => {
  let root: Root | undefined;
  let el: HTMLDivElement | undefined;

  afterEach(() => {
    vi.useRealTimers();
    act(() => root?.unmount());
    el?.remove();
    root = undefined;
    el = undefined;
  });

  function render(ids: string[], enabled = true) {
    if (!el) {
      el = document.createElement('div');
      document.body.appendChild(el);
      root = createRoot(el);
    }
    act(() => {
      root!.render(createElement(EnteringProbe, { ids, enabled }));
    });
    return [...el.querySelectorAll('[data-id]')].map((node) => ({
      id: node.getAttribute('data-id'),
      entering: node.getAttribute('data-entering'),
    }));
  }

  it('does not mark the first snapshot as entering', () => {
    expect(render(['a', 'b'])).toEqual([
      { id: 'a', entering: 'no' },
      { id: 'b', entering: 'no' },
    ]);
  });

  it('marks only newly added ids, including several at once', () => {
    vi.useFakeTimers();
    render(['a']);
    expect(render(['a', 'b', 'c'])).toEqual([
      { id: 'a', entering: 'no' },
      { id: 'b', entering: 'yes' },
      { id: 'c', entering: 'yes' },
    ]);

    act(() => {
      vi.advanceTimersByTime(MOTION_ENTER_MS);
    });
    expect(render(['a', 'b', 'c'])).toEqual([
      { id: 'a', entering: 'no' },
      { id: 'b', entering: 'no' },
      { id: 'c', entering: 'no' },
    ]);
  });

  it('does not individually enter when growing from an empty known set', () => {
    render([]);
    expect(render(['a', 'b'])).toEqual([
      { id: 'a', entering: 'no' },
      { id: 'b', entering: 'no' },
    ]);
  });

  it('keeps known in sync while disabled so deferred inserts do not replay', () => {
    render(['a'], true);
    render(['a', 'b'], false);
    expect(render(['a', 'b'], true)).toEqual([
      { id: 'a', entering: 'no' },
      { id: 'b', entering: 'no' },
    ]);
  });
});
