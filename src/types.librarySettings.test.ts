import { describe, expect, it } from 'vitest';
import { normalizeLibrarySettings, normalizeRequestSortBy } from './types';

describe('normalizeRequestSortBy', () => {
  it('accepts known sort values', () => {
    expect(normalizeRequestSortBy('bpm')).toBe('bpm');
    expect(normalizeRequestSortBy('title')).toBe('title');
  });

  it('falls back to order for invalid values', () => {
    expect(normalizeRequestSortBy('not-a-sort')).toBe('order');
    expect(normalizeRequestSortBy(undefined)).toBe('order');
  });
});

describe('normalizeLibrarySettings requestSortBy', () => {
  it('defaults to order when missing', () => {
    expect(normalizeLibrarySettings({}).requestSortBy).toBe('order');
  });

  it('preserves a stored preference', () => {
    expect(normalizeLibrarySettings({ requestSortBy: 'artist' }).requestSortBy).toBe('artist');
  });

  it('keeps other settings when normalizing sort', () => {
    const settings = normalizeLibrarySettings({
      hideDjTips: true,
      requestSortBy: 'bpm',
    });
    expect(settings.hideDjTips).toBe(true);
    expect(settings.requestSortBy).toBe('bpm');
  });
});
