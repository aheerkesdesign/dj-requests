import { Playlist, Track } from '../types';

/**
 * True when optional track meta is worth showing.
 * Treats null/empty/whitespace and placeholder zeros ("0", 0, "0.0") as missing.
 */
export function hasPresentMetaValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'number') {
    return Number.isFinite(value) && value !== 0;
  }
  const text = String(value).trim();
  if (!text) return false;
  if (/^0+(?:\.0+)?$/.test(text)) return false;
  return true;
}

/** Playlist ids this track belongs to, matching the client-side playlist filter. */
export function playlistIdsForTrack(track: Track, playlists: Playlist[]): string[] {
  const names = new Set(track.playlists || []);
  const ids: string[] = [];
  for (const playlist of playlists) {
    const byName = names.has(playlist.name);
    const byId = Boolean(track.trackId && playlist.trackIds?.includes(track.trackId));
    if (byName || byId) ids.push(playlist.id);
  }
  return ids;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when `longer` is `shorter` plus a version/remix suffix, e.g. "Title (Radio Edit)". */
export function isVersionVariantTitle(longer: string, shorter: string): boolean {
  if (!shorter || !longer.startsWith(shorter)) return false;
  if (longer.length === shorter.length) return true;
  return /^\s*[\(\[\-–—]/.test(longer.slice(shorter.length));
}

/** True when `needle` appears in `haystack` as a whole phrase (not mid-word). */
export function containsAsPhrase(haystack: string, needle: string): boolean {
  if (!needle || needle.length < 3) return false;
  if (haystack === needle) return true;
  const re = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}(?:[^\\p{L}\\p{N}]|$)`, 'u');
  return re.test(haystack);
}

function artistsOverlap(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

function artistsCompatible(reqArtist: string, trackArtist: string): boolean {
  if (!reqArtist || !trackArtist) return true;
  return artistsOverlap(reqArtist, trackArtist);
}

/**
 * Decide whether a catalog track fulfills a song request.
 *
 * - Exact title, or title + remix/version suffix → match (artist optional / compatible).
 * - Incomplete request title contained as a phrase in the library title → only with artist overlap.
 * - Never treat a longer request (e.g. "Baby Shark") as a hit on a shorter library title ("Baby").
 */
export function trackMatchesRequest(
  request: { title: string; artist?: string },
  track: Pick<Track, 'name' | 'artist'>
): boolean {
  const reqTitle = request.title.toLowerCase().trim();
  const reqArtist = (request.artist || '').toLowerCase().trim();
  if (!reqTitle) return false;

  const tName = track.name.toLowerCase().trim();
  const tArtist = track.artist.toLowerCase().trim();
  if (!tName) return false;

  if (
    tName === reqTitle ||
    isVersionVariantTitle(tName, reqTitle) ||
    isVersionVariantTitle(reqTitle, tName)
  ) {
    return artistsCompatible(reqArtist, tArtist);
  }

  // Guest typed a shorter/incomplete title; require artist so "Love" alone cannot match randomly.
  if (
    reqArtist &&
    tArtist &&
    artistsOverlap(reqArtist, tArtist) &&
    containsAsPhrase(tName, reqTitle)
  ) {
    return true;
  }

  return false;
}

export function isTrackInLibrary(
  request: { title: string; artist?: string },
  tracks: Track[] = []
): boolean {
  if (!tracks || tracks.length === 0) return false;
  return tracks.some((t) => trackMatchesRequest(request, t));
}

export function findTrackInLibrary(
  request: { title: string; artist?: string },
  tracks: Track[] = []
): Track | undefined {
  if (!tracks || tracks.length === 0) return undefined;
  return tracks.find((t) => trackMatchesRequest(request, t));
}
