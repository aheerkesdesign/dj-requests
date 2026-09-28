import { Playlist, Track } from '../types';

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

export function isTrackInLibrary(
  request: { title: string; artist?: string },
  tracks: Track[] = []
): boolean {
  if (!tracks || tracks.length === 0) return false;
  const reqTitle = request.title.toLowerCase().trim();
  const reqArtist = (request.artist || '').toLowerCase().trim();

  return tracks.some(t => {
    const tName = t.name.toLowerCase().trim();
    const tArtist = t.artist.toLowerCase().trim();

    if (tName === reqTitle) {
      if (!reqArtist || !tArtist) return true;
      return tArtist.includes(reqArtist) || reqArtist.includes(tArtist);
    }
    if (tName.includes(reqTitle) || reqTitle.includes(tName)) {
      if (reqArtist && tArtist) {
        return tArtist.includes(reqArtist) || reqArtist.includes(tArtist);
      }
      return true;
    }
    return false;
  });
}

export function findTrackInLibrary(
  request: { title: string; artist?: string },
  tracks: Track[] = []
): Track | undefined {
  if (!tracks || tracks.length === 0) return undefined;
  const reqTitle = request.title.toLowerCase().trim();
  const reqArtist = (request.artist || '').toLowerCase().trim();

  return tracks.find(t => {
    const tName = t.name.toLowerCase().trim();
    const tArtist = t.artist.toLowerCase().trim();

    if (tName === reqTitle) {
      if (!reqArtist || !tArtist) return true;
      return tArtist.includes(reqArtist) || reqArtist.includes(tArtist);
    }
    if (tName.includes(reqTitle) || reqTitle.includes(tName)) {
      if (reqArtist && tArtist) {
        return tArtist.includes(reqArtist) || reqArtist.includes(tArtist);
      }
      return true;
    }
    return false;
  });
}
