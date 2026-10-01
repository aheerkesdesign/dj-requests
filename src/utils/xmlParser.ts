import { Track, Playlist, PlaylistNode, USBLibrary } from '../types';
import { hasPresentMetaValue } from './library';

/**
 * Format total time in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const secsStr = secs < 10 ? `0${secs}` : `${secs}`;
  if (hrs > 0) {
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${minsStr}:${secsStr}`;
  }
  return `${mins}:${secsStr}`;
}

/**
 * Convert Rekordbox Tonality to standard Camelot notation or keep as is
 */
export function normalizeKey(tonality?: string): string {
  if (!tonality) return 'N/A';
  const clean = tonality.trim().toUpperCase();
  
  // Direct Camelot like "8A", "11B", "1A"
  if (/^[0-1]?[0-9][AB]$/.test(clean)) {
    return clean;
  }

  // Common Key to Camelot mappings
  const keyMap: Record<string, string> = {
    'A MINOR': '8A', 'AM': '8A', 'C MAJOR': '8B', 'C': '8B',
    'E MINOR': '9A', 'EM': '9A', 'G MAJOR': '9B', 'G': '9B',
    'B MINOR': '10A', 'BM': '10A', 'D MAJOR': '10B', 'D': '10B',
    'F# MINOR': '11A', 'F#M': '11A', 'A MAJOR': '11B', 'A': '11B',
    'C# MINOR': '12A', 'C#M': '12A', 'E MAJOR': '12B', 'E': '12B',
    'G# MINOR': '1A', 'G#M': '1A', 'B MAJOR': '1B', 'B': '1B',
    'D# MINOR': '2A', 'D#M': '2A', 'EB MINOR': '2A', 'EBM': '2A', 'F# MAJOR': '2B', 'F#': '2B', 'GB MAJOR': '2B',
    'A# MINOR': '3A', 'A#M': '3A', 'BB MINOR': '3A', 'BBM': '3A', 'C# MAJOR': '3B', 'DB MAJOR': '3B',
    'F MINOR': '4A', 'FM': '4A', 'G# MAJOR': '4B', 'AB MAJOR': '4B',
    'C MINOR': '5A', 'CM': '5A', 'D# MAJOR': '5B', 'EB MAJOR': '5B',
    'G MINOR': '6A', 'GM': '6A', 'A# MAJOR': '6B', 'BB MAJOR': '6B',
    'D MINOR': '7A', 'DM': '7A', 'F MAJOR': '7B', 'F': '7B',
  };

  return keyMap[clean] || tonality;
}

/**
 * Recursively parse a Rekordbox XML <NODE> tag into a PlaylistNode
 */
function parseNodeElement(
  nodeEl: Element,
  idxPath: string,
  playlists: Playlist[],
  trackIdToPlaylistMap: Map<string, string[]>
): PlaylistNode | null {
  const type = nodeEl.getAttribute('Type'); // '0' = Folder, '1' = Playlist
  const name = nodeEl.getAttribute('Name') || 'Onbekend';

  if (type === '1') {
    // Playlist
    const trackElements = Array.from(nodeEl.children).filter(child => child.tagName === 'TRACK');
    const trackIds: string[] = [];

    trackElements.forEach(tEl => {
      const key = tEl.getAttribute('Key');
      if (key) {
        trackIds.push(key);
        const existing = trackIdToPlaylistMap.get(key) || [];
        if (!existing.includes(name)) {
          existing.push(name);
          trackIdToPlaylistMap.set(key, existing);
        }
      }
    });

    const playlistId = `pl-${idxPath}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    playlists.push({
      id: playlistId,
      name,
      trackCount: trackIds.length,
      trackIds,
    });

    return {
      id: playlistId,
      name,
      type: 'playlist',
      playlistId,
      trackCount: trackIds.length,
      trackIds,
    };
  } else if (type === '0') {
    // Folder
    const childNodeElements = Array.from(nodeEl.children).filter(child => child.tagName === 'NODE');
    const children: PlaylistNode[] = [];

    childNodeElements.forEach((childEl, cIdx) => {
      const childNode = parseNodeElement(childEl, `${idxPath}-${cIdx}`, playlists, trackIdToPlaylistMap);
      if (childNode) {
        children.push(childNode);
      }
    });

    return {
      id: `dir-${idxPath}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      type: 'folder',
      children,
    };
  }

  return null;
}

/**
 * Parse Rekordbox XML content string into structured USBLibrary object
 */
export function parseRekordboxXML(xmlContent: string, libraryName: string = 'Mijn Rekordbox USB', djName: string = 'DJ'): USBLibrary {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for XML parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Ongeldig XML bestand. Zorg ervoor dat dit een echt Rekordbox XML exportbestand is.');
  }

  const trackMap = new Map<string, Track>();
  const trackIdToPlaylistMap = new Map<string, string[]>();

  // 1. Parse Playlists & Folder Tree
  const playlists: Playlist[] = [];
  const topNodeElements = Array.from(xmlDoc.querySelectorAll('PLAYLISTS > NODE'));
  const parsedTopNodes: PlaylistNode[] = [];

  topNodeElements.forEach((nodeEl, idx) => {
    const node = parseNodeElement(nodeEl, `${idx}`, playlists, trackIdToPlaylistMap);
    if (node) parsedTopNodes.push(node);
  });

  let playlistTree: PlaylistNode[] = [];
  if (parsedTopNodes.length === 1 && parsedTopNodes[0].type === 'folder' && parsedTopNodes[0].name.toUpperCase() === 'ROOT' && parsedTopNodes[0].children) {
    playlistTree = parsedTopNodes[0].children;
  } else {
    playlistTree = parsedTopNodes;
  }

  // 2. Parse Tracks from <COLLECTION>
  const trackElements = xmlDoc.querySelectorAll('COLLECTION > TRACK');

  trackElements.forEach((el, index) => {
    const trackId = el.getAttribute('TrackID') || `${index + 1}`;
    const name = el.getAttribute('Name') || 'Onbekend nummer';
    const artist = el.getAttribute('Artist') || 'Onbekende artiest';
    const composer = el.getAttribute('Composer') || '';
    const albumRaw = el.getAttribute('Album') || '';
    const album = hasPresentMetaValue(albumRaw) ? albumRaw.trim() : '';
    const genreRaw = el.getAttribute('Genre') || '';
    const genre =
      genreRaw === 'Algemeen' || !hasPresentMetaValue(genreRaw) ? '' : genreRaw.trim();
    const bpmRaw = parseFloat(el.getAttribute('AverageBpm') || '0');
    const bpm = Math.round(bpmRaw * 10) / 10;
    const tonality = el.getAttribute('Tonality') || 'N/A';
    const duration = parseInt(el.getAttribute('TotalTime') || '0', 10);
    const yearRaw = el.getAttribute('Year') || '';
    const year = hasPresentMetaValue(yearRaw) ? yearRaw.trim() : '';
    const comments = el.getAttribute('Comments') || '';
    const rating = parseInt(el.getAttribute('Rating') || '0', 10);
    const dateAdded = el.getAttribute('DateAdded') || '';
    const bitrate = el.getAttribute('BitRate') || '';

    const associatedPlaylists = trackIdToPlaylistMap.get(trackId) || [];

    const track: Track = {
      id: `tr-${trackId}`,
      trackId,
      name,
      artist,
      composer,
      album,
      genre,
      bpm,
      key: normalizeKey(tonality),
      duration,
      durationFormatted: formatDuration(duration),
      year,
      comments,
      rating,
      dateAdded,
      playlists: associatedPlaylists,
      bitrate,
    };

    trackMap.set(trackId, track);
  });

  const tracks = Array.from(trackMap.values());

  return {
    id: `usb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: libraryName,
    djName: djName,
    description: `Rekordbox USB bibliotheek met ${tracks.length} nummers en ${playlists.length} afspeellijsten.`,
    trackCount: tracks.length,
    playlistCount: playlists.length,
    updatedAt: new Date().toISOString(),
    tracks,
    playlists,
    playlistTree,
  };
}
