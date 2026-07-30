import { Track, TrackRequest } from '../types';

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
