import React from 'react';
import { Playlist, Track } from '../types';
import { Folder, Disc, Music, ChevronRight, ListMusic } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  allTracks: Track[];
  onSelectPlaylist: (playlistName: string) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({ playlists, allTracks, onSelectPlaylist }) => {
  if (!playlists || playlists.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center my-4 space-y-2 text-zinc-400 text-xs">
        <Folder className="w-8 h-8 text-zinc-600 mx-auto" />
        <p>Geen afspeellijsten gevonden in dit XML bestand.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span className="font-semibold text-zinc-200">Rekordbox Afspeellijsten ({playlists.length})</span>
        <span>Klik op een afspeellijst om de nummers te bekijken</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {playlists.map(pl => {
          // Count actual matching tracks in our loaded tracks
          const matchingTracks = allTracks.filter(t => t.playlists && t.playlists.includes(pl.name));

          return (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.name)}
              className="text-left p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-emerald-500/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0">
                  <ListMusic className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
                    {pl.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {matchingTracks.length > 0 ? matchingTracks.length : pl.trackCount} nummers
                  </p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
