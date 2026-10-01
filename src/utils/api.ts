import { supabase, getLogoPublicUrl } from '../lib/supabase';
import type { Database, Json } from '../lib/database.types';
import { mapProfile, PROFILE_COLUMNS, PROFILE_PUBLIC_COLUMNS } from '../lib/profile';
import type {
  USBLibrary,
  TrackRequest,
  SocialLinks,
  RequestStatus,
  RequestKind,
  Track,
  Playlist,
  PlaylistNode,
  Profile,
  SubscriptionStatus,
  TrackDisplayPrefs,
  LibrarySettings,
} from '../types';
import { normalizeTrackDisplayPrefs, normalizeLibrarySettings } from '../types';
import { playlistIdsForTrack } from './library';

export const TRACK_PAGE_SIZE = 50;

const LIBRARY_COLUMNS =
  'id, owner_id, name, description, playlists, playlist_tree, selected_playlist_ids, track_count, playlist_count, track_display_prefs, library_settings, updated_at, created_at';

type LibraryRow = Database['public']['Tables']['libraries']['Row'];
type LibraryUpdate = Database['public']['Tables']['libraries']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type RequestRow = Database['public']['Tables']['requests']['Row'];
type ProfilePublic = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'display_name' | 'slug' | 'logo_path' | 'start_image_path' | 'socials' | 'subscription_status'
>;

function dedupeTracks(tracks: Track[]): Track[] {
  const byKey = new Map<string, Track>();
  for (const track of tracks) {
    byKey.set(track.trackId || track.id, track);
  }
  return [...byKey.values()];
}

function mapRequest(row: RequestRow): TrackRequest {
  return {
    id: row.id,
    libraryId: row.library_id,
    title: row.title,
    artist: row.artist,
    kind: (row.kind ?? 'playable') as RequestKind,
    status: row.status as RequestStatus,
    createdAt: row.created_at,
  };
}

function mapLibraryRow(lib: LibraryRow, profile?: ProfilePublic | null): USBLibrary {
  return {
    id: lib.id,
    ownerId: lib.owner_id,
    slug: profile?.slug,
    name: lib.name,
    djName: profile?.display_name || 'DJ',
    logoUrl: getLogoPublicUrl(profile?.logo_path),
    startImageUrl: getLogoPublicUrl(profile?.start_image_path),
    socials: (profile?.socials || {}) as SocialLinks,
    description: lib.description || '',
    trackCount: lib.track_count ?? 0,
    playlistCount: lib.playlist_count ?? (Array.isArray(lib.playlists) ? lib.playlists.length : 0),
    updatedAt: lib.updated_at,
    tracks: [],
    playlists: (lib.playlists as unknown as Playlist[]) || [],
    playlistTree: (lib.playlist_tree as unknown as PlaylistNode[] | null) || undefined,
    selectedPlaylistIds: lib.selected_playlist_ids ?? undefined,
    trackDisplayPrefs: normalizeTrackDisplayPrefs(lib.track_display_prefs),
    librarySettings: normalizeLibrarySettings(lib.library_settings),
    subscriptionStatus: (profile?.subscription_status || 'none') as SubscriptionStatus,
  };
}

async function loadLibraryForOwner(ownerId: string): Promise<USBLibrary | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq('id', ownerId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  const { data: lib, error: libError } = await supabase
    .from('libraries')
    .select(LIBRARY_COLUMNS)
    .eq('owner_id', ownerId)
    .maybeSingle();

  if (libError) throw new Error(libError.message);
  if (!lib) return null;

  return mapLibraryRow(lib as LibraryRow, profile as ProfilePublic);
}

export async function fetchLibraryBySlug(slug: string): Promise<USBLibrary | null> {
  const normalized = slug.trim().toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq('slug', normalized)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  return loadLibraryForOwner(profile.id);
}

export async function fetchMyLibrary(userId: string): Promise<USBLibrary | null> {
  return loadLibraryForOwner(userId);
}

export async function fetchLibrary(id: string): Promise<USBLibrary> {
  const { data: lib, error } = await supabase.from('libraries').select(LIBRARY_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!lib) throw new Error('Bibliotheek niet gevonden');

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_PUBLIC_COLUMNS)
    .eq('id', (lib as LibraryRow).owner_id)
    .maybeSingle();

  return mapLibraryRow(lib as LibraryRow, profile as ProfilePublic | null);
}

export async function upsertMyLibraryCatalog(
  userId: string,
  libraryData: Partial<USBLibrary>
): Promise<USBLibrary> {
  const tracks = dedupeTracks(libraryData.tracks || []);
  const playlists = libraryData.playlists || [];
  const payload: LibraryUpdate & { owner_id: string } = {
    owner_id: userId,
    name: libraryData.name || 'Mijn USB-bibliotheek',
    description: libraryData.description || '',
    tracks: [] as Json,
    playlists: playlists as unknown as Json,
    playlist_tree: (libraryData.playlistTree ?? null) as unknown as Json | null,
    track_count: tracks.length,
    playlist_count: playlists.length,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  let lib: LibraryRow;
  if (existing?.id) {
    const { data, error } = await supabase
      .from('libraries')
      .update(payload)
      .eq('id', existing.id)
      .select(LIBRARY_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    lib = data as LibraryRow;
  } else {
    const { data, error } = await supabase.from('libraries').insert(payload).select(LIBRARY_COLUMNS).single();
    if (error) throw new Error(error.message);
    lib = data as LibraryRow;
  }

  await replaceLibraryTracks(lib.id, tracks, playlists);

  const { error: clearError } = await supabase.from('requests').delete().eq('library_id', lib.id);
  if (clearError) throw new Error(clearError.message);

  return fetchLibrary(lib.id);
}

export async function updateMyProfile(
  userId: string,
  updates: {
    displayName?: string;
    slug?: string;
    logoPath?: string | null;
    startImagePath?: string | null;
    socials?: SocialLinks;
  }
): Promise<Profile> {
  const patch: ProfileUpdate = {};
  if (updates.displayName !== undefined) patch.display_name = updates.displayName;
  if (updates.slug !== undefined) patch.slug = updates.slug.trim().toLowerCase();
  if (updates.logoPath !== undefined) patch.logo_path = updates.logoPath;
  if (updates.startImagePath !== undefined) patch.start_image_path = updates.startImagePath;
  if (updates.socials !== undefined) patch.socials = updates.socials as Json;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function updateLibraryDetails(
  libraryId: string,
  updates: {
    name?: string;
    description?: string;
    selectedPlaylistIds?: string[];
    trackDisplayPrefs?: TrackDisplayPrefs;
    librarySettings?: LibrarySettings;
  }
): Promise<USBLibrary> {
  const patch: LibraryUpdate = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.selectedPlaylistIds !== undefined) {
    patch.selected_playlist_ids = updates.selectedPlaylistIds;
  }
  if (updates.trackDisplayPrefs !== undefined) {
    patch.track_display_prefs = normalizeTrackDisplayPrefs(updates.trackDisplayPrefs) as unknown as Json;
  }
  if (updates.librarySettings !== undefined) {
    patch.library_settings = updates.librarySettings as unknown as Json;
  }

  const { error } = await supabase.from('libraries').update(patch).eq('id', libraryId);
  if (error) throw new Error(error.message);
  return fetchLibrary(libraryId);
}

function isManagedStoragePath(path: string): boolean {
  return !/^https?:\/\//i.test(path) && !path.startsWith('data:');
}

/** Best-effort delete of a logos-bucket object. Ignores external/data URLs. */
export async function removeStorageFile(path: string | null | undefined): Promise<void> {
  if (!path || !isManagedStoragePath(path)) return;
  const { error } = await supabase.storage.from('logos').remove([path]);
  if (error) {
    console.warn('Failed to remove storage file:', path, error.message);
  }
}

async function uploadBrandingAsset(
  userId: string,
  kind: 'logo' | 'start',
  blob: Blob,
  ext = 'jpg'
): Promise<string> {
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('logos').upload(path, blob, {
    upsert: true,
    contentType: blob.type || `image/${ext}`,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadLogo(userId: string, blob: Blob, ext = 'jpg'): Promise<string> {
  return uploadBrandingAsset(userId, 'logo', blob, ext);
}

export async function uploadStartImage(userId: string, blob: Blob, ext = 'jpg'): Promise<string> {
  return uploadBrandingAsset(userId, 'start', blob, ext);
}

const TRACK_INSERT_CHUNK = 400;

async function replaceLibraryTracks(libraryId: string, tracks: Track[], playlists: Playlist[]): Promise<void> {
  const { error: deleteError } = await supabase.from('library_tracks').delete().eq('library_id', libraryId);
  if (deleteError) throw new Error(deleteError.message);

  for (let i = 0; i < tracks.length; i += TRACK_INSERT_CHUNK) {
    const rows = tracks.slice(i, i + TRACK_INSERT_CHUNK).map((track) => ({
      library_id: libraryId,
      track_key: track.trackId || track.id,
      name: track.name || '',
      artist: track.artist || '',
      playlist_ids: playlistIdsForTrack(track, playlists),
      data: track as unknown as Json,
    }));
    const { error } = await supabase.from('library_tracks').insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function searchLibraryTracks(
  libraryId: string,
  options: {
    query?: string;
    playlistIds?: string[] | null;
    sortBy?: 'title' | 'artist';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ tracks: Track[]; total: number }> {
  const { data, error } = await supabase.rpc('search_library_tracks', {
    p_library_id: libraryId,
    p_query: options.query ?? '',
    p_playlist_ids: options.playlistIds ?? null,
    p_sort: options.sortBy === 'artist' ? 'artist' : 'name',
    p_order: options.sortOrder === 'desc' ? 'desc' : 'asc',
    p_limit: options.limit ?? TRACK_PAGE_SIZE,
    p_offset: options.offset ?? 0,
  });
  if (error) throw new Error(error.message);
  const payload = (data ?? {}) as { tracks?: Track[]; total?: number };
  return {
    tracks: Array.isArray(payload.tracks) ? payload.tracks : [],
    total: Number(payload.total ?? 0),
  };
}

export async function matchRequestTracks(
  libraryId: string,
  requests: { title: string; artist?: string }[]
): Promise<Track[]> {
  if (requests.length === 0) return [];
  const { data, error } = await supabase.rpc('match_request_tracks', {
    p_library_id: libraryId,
    p_requests: requests.map((request) => ({
      title: request.title,
      artist: request.artist ?? '',
    })),
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? (data as unknown as Track[]) : [];
}

export async function fetchRequests(libraryId: string): Promise<TrackRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapRequest(row as RequestRow));
}

export async function submitRequest(
  libraryId: string,
  title: string,
  artist: string,
  kind: RequestKind
): Promise<TrackRequest> {
  const { data, error } = await supabase
    .from('requests')
    .insert({
      library_id: libraryId,
      title: title.trim(),
      artist: artist.trim(),
      kind,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Dit nummer staat al in de wachtrij.');
    }
    throw new Error(error.message || 'Kon verzoek niet opslaan');
  }
  return mapRequest(data as RequestRow);
}

export async function updateRequestStatus(
  libraryId: string,
  requestId: string,
  status: string
): Promise<TrackRequest> {
  const { data, error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId)
    .eq('library_id', libraryId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapRequest(data as RequestRow);
}

export async function deleteRequest(libraryId: string, requestId: string): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', requestId)
    .eq('library_id', libraryId);
  if (error) throw new Error(error.message);
}

export async function clearAllRequests(
  libraryId: string,
  options?: { reqIds?: string[] }
): Promise<void> {
  let query = supabase.from('requests').delete().eq('library_id', libraryId);
  if (options?.reqIds && options.reqIds.length > 0) {
    query = query.in('id', options.reqIds);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
}

export function subscribeToRequests(
  libraryId: string,
  onChange: (requests: TrackRequest[]) => void
): () => void {
  const reload = async () => {
    try {
      const list = await fetchRequests(libraryId);
      onChange(list);
    } catch (err) {
      console.warn('Requests realtime refresh failed', err);
    }
  };

  // Bulk clears emit one DELETE per row; coalesce into a single refetch.
  let debounceTimer: number | undefined;
  const scheduleReload = () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      debounceTimer = undefined;
      void reload();
    }, 100);
  };

  const channel = supabase
    .channel(`requests:${libraryId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests', filter: `library_id=eq.${libraryId}` },
      () => {
        scheduleReload();
      }
    )
    .subscribe();

  return () => {
    window.clearTimeout(debounceTimer);
    void supabase.removeChannel(channel);
  };
}

export function subscribeToLibrary(
  libraryId: string,
  onChange: (library: USBLibrary) => void
): () => void {
  const channel = supabase
    .channel(`library:${libraryId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'libraries', filter: `id=eq.${libraryId}` },
      async () => {
        try {
          const lib = await fetchLibrary(libraryId);
          onChange(lib);
        } catch (err) {
          console.warn('Library realtime refresh failed', err);
        }
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function buildShareUrl(slug: string): string {
  if (typeof window === 'undefined') return `/d/${slug}`;
  return `${window.location.origin}/d/${slug}`;
}
