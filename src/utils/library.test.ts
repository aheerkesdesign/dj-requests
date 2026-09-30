import { describe, expect, it } from 'vitest';
import {
  isTrackInLibrary,
  findTrackInLibrary,
  playlistIdsForTrack,
  hasPresentMetaValue,
  trackMatchesRequest,
  isVersionVariantTitle,
  containsAsPhrase,
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

describe('isVersionVariantTitle', () => {
  it('allows remix/remaster suffixes', () => {
    expect(isVersionVariantTitle('one more time (radio edit)', 'one more time')).toBe(true);
    expect(isVersionVariantTitle('blue monday - remastered', 'blue monday')).toBe(true);
    expect(isVersionVariantTitle('track [extended]', 'track')).toBe(true);
  });

  it('rejects an extra word that is not a version suffix', () => {
    expect(isVersionVariantTitle('baby shark', 'baby')).toBe(false);
    expect(isVersionVariantTitle('love story', 'love')).toBe(false);
  });
});

describe('containsAsPhrase', () => {
  it('matches whole phrases, not mid-word substrings', () => {
    expect(containsAsPhrase('blue monday', 'monday')).toBe(true);
    expect(containsAsPhrase('beloved', 'love')).toBe(false);
    expect(containsAsPhrase('age of love', 'love')).toBe(true);
  });

  it('ignores very short needles', () => {
    expect(containsAsPhrase('i will survive', 'i')).toBe(false);
    expect(containsAsPhrase('me and you', 'me')).toBe(false);
  });
});

describe('trackMatchesRequest / isTrackInLibrary', () => {
  const tracks = [
    track({ name: 'Blue Monday', artist: 'New Order', trackId: '10' }),
    track({ id: 'tr-2', trackId: '11', name: 'Age of Love', artist: 'Age of Love' }),
    track({ id: 'tr-3', trackId: '12', name: 'Baby', artist: 'Justin Bieber' }),
    track({ id: 'tr-4', trackId: '13', name: 'One More Time', artist: 'Daft Punk' }),
    track({
      id: 'tr-5',
      trackId: '14',
      name: 'One More Time (Radio Edit)',
      artist: 'Daft Punk',
    }),
  ];

  it('matches title and overlapping artist', () => {
    expect(isTrackInLibrary({ title: 'Blue Monday', artist: 'New Order' }, tracks)).toBe(true);
    expect(isTrackInLibrary({ title: 'Blue Monday', artist: 'Someone Else' }, tracks)).toBe(false);
  });

  it('matches exact title without artist', () => {
    expect(isTrackInLibrary({ title: 'Baby' }, tracks)).toBe(true);
    expect(isTrackInLibrary({ title: 'Blue Monday' }, tracks)).toBe(true);
  });

  it('matches a partial/incomplete title only when the artist overlaps', () => {
    expect(isTrackInLibrary({ title: 'Monday', artist: 'New' }, tracks)).toBe(true);
    expect(isTrackInLibrary({ title: 'Monday' }, tracks)).toBe(false);
  });

  it('does not match a longer request title against a shorter library title', () => {
    // Reported bug: Baby Shark (not on USB) was matched to Baby (Justin Bieber).
    expect(isTrackInLibrary({ title: 'Baby Shark' }, tracks)).toBe(false);
    expect(isTrackInLibrary({ title: 'Baby Shark', artist: 'Pinkfong' }, tracks)).toBe(false);
    expect(isTrackInLibrary({ title: 'Baby Shark', artist: 'Justin Bieber' }, tracks)).toBe(false);
    expect(findTrackInLibrary({ title: 'Baby Shark' }, tracks)).toBeUndefined();
  });

  it('does not match other short-title substring false positives', () => {
    expect(isTrackInLibrary({ title: 'Love Story' }, tracks)).toBe(false);
    expect(isTrackInLibrary({ title: 'Love' }, tracks)).toBe(false);
    expect(isTrackInLibrary({ title: 'One' }, tracks)).toBe(false);
  });

  it('matches version/remix suffix variants', () => {
    expect(
      trackMatchesRequest(
        { title: 'One More Time' },
        track({ name: 'One More Time (Radio Edit)', artist: 'Daft Punk' })
      )
    ).toBe(true);
    expect(
      trackMatchesRequest(
        { title: 'One More Time (Radio Edit)' },
        track({ name: 'One More Time', artist: 'Daft Punk' })
      )
    ).toBe(true);
  });

  it('is false for an empty catalog', () => {
    expect(isTrackInLibrary({ title: 'Blue Monday', artist: 'New Order' }, [])).toBe(false);
  });
});

describe('findTrackInLibrary', () => {
  const tracks = [track({ name: 'Blue Monday', artist: 'New Order', trackId: '10' })];

  it('returns the matching track', () => {
    expect(findTrackInLibrary({ title: 'Blue Monday', artist: 'New Order' }, tracks)?.trackId).toBe(
      '10'
    );
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
    expect(
      playlistIdsForTrack(track({ name: 'Blue Monday', artist: 'New Order', trackId: '10' }), playlists)
    ).toEqual(['pl-a']);
    expect(
      playlistIdsForTrack(
        track({ name: 'Loose', artist: 'DJ', trackId: '99', playlists: ['Other'] }),
        playlists
      )
    ).toEqual(['pl-b']);
  });
});
