import { describe, expect, it } from 'vitest';
import {
  normalizeLibrarySettings,
  normalizeRequestButtonStyle,
  normalizeRequestSortBy,
} from './types';

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

describe('normalizeRequestButtonStyle', () => {
  it('accepts icon style', () => {
    expect(normalizeRequestButtonStyle('icon')).toBe('icon');
  });

  it('defaults to text for missing or invalid values', () => {
    expect(normalizeRequestButtonStyle('text')).toBe('text');
    expect(normalizeRequestButtonStyle(undefined)).toBe('text');
    expect(normalizeRequestButtonStyle('pill')).toBe('text');
  });
});

describe('normalizeLibrarySettings', () => {
  it('defaults show flags to true when missing', () => {
    const settings = normalizeLibrarySettings({});
    expect(settings.requestSortBy).toBe('order');
    expect(settings.requestButtonStyle).toBe('text');
    expect(settings.showStartScreen).toBe(true);
    expect(settings.showPlayedDeclinedToGuests).toBe(true);
    expect(settings.showDjTips).toBe(true);
    expect(settings.enableDownloadRequests).toBe(true);
  });

  it('preserves a stored sort preference', () => {
    expect(normalizeLibrarySettings({ requestSortBy: 'artist' }).requestSortBy).toBe('artist');
  });

  it('preserves a stored request button style', () => {
    expect(normalizeLibrarySettings({ requestButtonStyle: 'icon' }).requestButtonStyle).toBe(
      'icon'
    );
  });

  it('keeps other settings when normalizing sort', () => {
    const settings = normalizeLibrarySettings({
      showDjTips: false,
      requestSortBy: 'bpm',
    });
    expect(settings.showDjTips).toBe(false);
    expect(settings.requestSortBy).toBe('bpm');
  });

  it('migrates legacy hide/skip keys to show flags', () => {
    const settings = normalizeLibrarySettings({
      skipStartScreen: true,
      hidePlayedDeclinedFromGuests: true,
      hideDjTips: true,
    });
    expect(settings.showStartScreen).toBe(false);
    expect(settings.showPlayedDeclinedToGuests).toBe(false);
    expect(settings.showDjTips).toBe(false);
  });

  it('prefers new show keys over legacy hide keys', () => {
    const settings = normalizeLibrarySettings({
      showDjTips: true,
      hideDjTips: true,
    });
    expect(settings.showDjTips).toBe(true);
  });
});
