import { describe, expect, it } from 'vitest';
import {
  isTrackInLibrary,
  findTrackInLibrary,
  playlistIdsForTrack,
  hasPresentMetaValue,
} from './library';
import type { Playlist, Track } from '../types';

function track(partial: Partial<Track> & Pick<Track, 'name' | 'artist'>): Track {
  return {
    id: partial.id ?? 'tr-1',
    trackId: partial.trackId ?? '1',
    bpm: 0,
    key: '8A',
    duration: 0,
    durationFormatted: '0:00',
    rating: 0,
    playlists: [],
    ...partial,
  };
}

describe('hasPresentMetaValue', () => {
  it('rejects empty and placeholder zeros', () => {
    expect(hasPresentMetaValue(undefined)).toBe(false);
    expect(hasPresentMetaValue(null)).toBe(false);
    expect(hasPresentMetaValue('')).toBe(false);
    expect(hasPresentMetaValue('   ')).toBe(false);
    expect(hasPresentMetaValue(0)).toBe(false);
    expect(hasPresentMetaValue('0')).toBe(false);
    expect(hasPresentMetaValue('00')).toBe(false);
    expect(hasPresentMetaValue('0.0')).toBe(false);
  });

  it('accepts real values', () => {
    expect(hasPresentMetaValue('House')).toBe(true);
    expect(hasPresentMetaValue('1983')).toBe(true);
    expect(hasPresentMetaValue(128)).toBe(true);
    expect(hasPresentMetaValue('007')).toBe(true);
  });
});

describe('isTrackInLibrary', () => {
  const tracks = [
    track({ name: 'Blue Monday', artist: 'New Order', trackId: '10' }),
    track({ id: 'tr-2', trackId: '11', name: 'Age of Love', artist: 'Age of Love' }),
  ];

  it('matches title and overlapping artist', () => {
    expect(isTrackInLibrary({ title: 'Blue Monday', artist: 'New Order' }, tracks)).toBe(true);
    expect(isTrackInLibrary({ title: 'Blue Monday', artist: 'Someone Else' }, tracks)).toBe(false);
  });

  it('matches a partial title when the artist overlaps', () => {
    expect(isTrackInLibrary({ title: 'Monday', artist: 'New' }, tracks)).toBe(true);
  });

  it('is false for an empty catalog', () => {
    expect(isTrackInLibrary({ title: 'Blue Monday', artist: 'New Order' }, [])).toBe(false);
  });
});

describe('findTrackInLibrary', () => {
  const tracks = [track({ name: 'Blue Monday', artist: 'New Order', trackId: '10' })];

  it('returns the matching track', () => {
    expect(findTrackInLibrary({ title: 'Blue Monday', artist: 'New Order' }, tracks)?.trackId).toBe('10');
  });

  it('returns undefined when nothing matches', () => {
    expect(findTrackInLibrary({ title: 'Missing', artist: 'Nobody' }, tracks)).toBeUndefined();
  });
});

describe('playlistIdsForTrack', () => {
  const playlists: Playlist[] = [
    { id: 'pl-a', name: 'Set', trackCount: 1, trackIds: ['10'] },
    { id: 'pl-b', name: 'Other', trackCount: 0, trackIds: [] },
  ];

  it('includes playlists by Rekordbox track id or by name', () => {
    expect(playlistIdsForTrack(track({ name: 'Blue Monday', artist: 'New Order', trackId: '10' }), playlists)).toEqual([
      'pl-a',
    ]);
    expect(
      playlistIdsForTrack(
        track({ name: 'Loose', artist: 'DJ', trackId: '99', playlists: ['Other'] }),
        playlists
      )
    ).toEqual(['pl-b']);
  });
});
