import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MOTION_EXIT_MS, useArriveFromEmpty, useRemoteListClear } from './useMotionPresence';

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

  it('does not treat a metadata hold as an empty list', () => {
    expect(render(0, false)).toBe('no');
    expect(render(2, true)).toBe('no');
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
