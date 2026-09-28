import { describe, expect, it } from 'vitest';
import { normalizeKey, parseRekordboxXML } from './xmlParser';

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS>
  <COLLECTION Entries="1">
    <TRACK TrackID="10" Name="Blue Monday" Artist="New Order" Album="Power, Corruption &amp; Lies" Genre="House" AverageBpm="130.50" Tonality="A minor" TotalTime="90" Year="1983" />
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT">
      <NODE Type="1" Name="Set">
        <TRACK Key="10" />
      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>`;

describe('normalizeKey', () => {
  it('keeps Camelot codes and maps note names', () => {
    expect(normalizeKey('8A')).toBe('8A');
    expect(normalizeKey('a minor')).toBe('8A');
    expect(normalizeKey('')).toBe('N/A');
  });
});

describe('parseRekordboxXML', () => {
  it('reads tracks and playlists from a Rekordbox export', () => {
    const library = parseRekordboxXML(sampleXml, 'USB', 'Alex');
    expect(library.trackCount).toBe(1);
    expect(library.playlistCount).toBe(1);
    expect(library.tracks[0]).toMatchObject({
      trackId: '10',
      name: 'Blue Monday',
      artist: 'New Order',
      key: '8A',
      bpm: 130.5,
      playlists: ['Set'],
    });
    expect(library.playlists[0].trackIds).toEqual(['10']);
  });

  it('drops placeholder zero year/album/genre values', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS>
  <COLLECTION Entries="1">
    <TRACK TrackID="1" Name="Untitled" Artist="DJ" Album="0" Genre="0" AverageBpm="0" Tonality="" TotalTime="0" Year="0" />
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT" />
  </PLAYLISTS>
</DJ_PLAYLISTS>`;
    const track = parseRekordboxXML(xml, 'USB', 'Alex').tracks[0];
    expect(track.album).toBe('');
    expect(track.genre).toBe('');
    expect(track.year).toBe('');
  });

  it('rejects XML the parser flags as invalid', () => {
    expect(() => parseRekordboxXML('<not xml')).toThrow(/Ongeldig XML/);
  });
});
