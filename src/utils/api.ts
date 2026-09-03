import { supabase, getLogoPublicUrl } from '../lib/supabase';
import type {
  LibrarySummary,
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

export function getClientId(): string {
  let id = localStorage.getItem('rekordbox_client_id');
  if (!id) {
    id = `cli-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('rekordbox_client_id', id);
  }
  return id;
}

function mapRequest(row: any): TrackRequest {
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

function mapLibraryRow(
  lib: any,
  profile?: {
    display_name?: string;
    slug?: string;
    logo_path?: string | null;
    start_image_path?: string | null;
    socials?: SocialLinks;
    subscription_status?: string;
  } | null
): USBLibrary {
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
    trackCount: lib.track_count ?? (Array.isArray(lib.tracks) ? lib.tracks.length : 0),
    playlistCount: lib.playlist_count ?? (Array.isArray(lib.playlists) ? lib.playlists.length : 0),
    updatedAt: lib.updated_at,
    tracks: (lib.tracks || []) as Track[],
    playlists: (lib.playlists || []) as Playlist[],
    playlistTree: (lib.playlist_tree || undefined) as PlaylistNode[] | undefined,
    selectedPlaylistIds: lib.selected_playlist_ids ?? undefined,
    trackDisplayPrefs: normalizeTrackDisplayPrefs(lib.track_display_prefs),
    librarySettings: normalizeLibrarySettings(lib.library_settings),
    subscriptionStatus: (profile?.subscription_status || 'none') as SubscriptionStatus,
  };
}

export async function fetchLibraryBySlug(slug: string): Promise<USBLibrary | null> {
  const normalized = slug.trim().toLowerCase();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, logo_path, start_image_path, socials, subscription_status')
    .eq('slug', normalized)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  const { data: lib, error: libError } = await supabase
    .from('libraries')
    .select('*')
    .eq('owner_id', profile.id)
    .maybeSingle();

  if (libError) throw new Error(libError.message);
  if (!lib) return null;

  return mapLibraryRow(lib, profile);
}

export async function fetchMyLibrary(userId: string): Promise<USBLibrary | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, slug, logo_path, start_image_path, socials, subscription_status')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile) return null;

  const { data: lib, error: libError } = await supabase
    .from('libraries')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (libError) throw new Error(libError.message);
  if (!lib) return null;

  return mapLibraryRow(lib, profile);
}

export async function fetchLibrary(id: string): Promise<USBLibrary> {
  const { data: lib, error } = await supabase.from('libraries').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!lib) throw new Error('Bibliotheek niet gevonden');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, slug, logo_path, start_image_path, socials, subscription_status')
    .eq('id', lib.owner_id)
    .maybeSingle();

  return mapLibraryRow(lib, profile);
}

export async function upsertMyLibraryCatalog(
  userId: string,
  libraryData: Partial<USBLibrary>
): Promise<USBLibrary> {
  const tracks = libraryData.tracks || [];
  const playlists = libraryData.playlists || [];
  const payload = {
    owner_id: userId,
    name: libraryData.name || 'Mijn USB Bibliotheek',
    description: libraryData.description || '',
    tracks,
    playlists,
    playlist_tree: libraryData.playlistTree ?? null,
    track_count: tracks.length,
    playlist_count: playlists.length,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  let lib;
  if (existing?.id) {
    const { data, error } = await supabase
      .from('libraries')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    lib = data;
  } else {
    const { data, error } = await supabase.from('libraries').insert(payload).select('*').single();
    if (error) throw new Error(error.message);
    lib = data;
  }

  // Clear requests on full library replace (matches previous single-upload UX)
  await supabase.from('requests').delete().eq('library_id', lib.id);

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
  const patch: Record<string, unknown> = {};
  if (updates.displayName !== undefined) patch.display_name = updates.displayName;
  if (updates.slug !== undefined) patch.slug = updates.slug.trim().toLowerCase();
  if (updates.logoPath !== undefined) patch.logo_path = updates.logoPath;
  if (updates.startImagePath !== undefined) patch.start_image_path = updates.startImagePath;
  if (updates.socials !== undefined) patch.socials = updates.socials;

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(
      'id, display_name, slug, logo_path, start_image_path, socials, stripe_customer_id, subscription_status, plan, current_period_end, created_at, updated_at'
    )
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    displayName: data.display_name,
    slug: data.slug,
    logoPath: data.logo_path,
    logoUrl: getLogoPublicUrl(data.logo_path),
    startImagePath: data.start_image_path,
    startImageUrl: getLogoPublicUrl(data.start_image_path),
    socials: (data.socials || {}) as SocialLinks,
    subscriptionStatus: (data.subscription_status || 'none') as SubscriptionStatus,
    plan: data.plan,
    currentPeriodEnd: data.current_period_end,
    stripeCustomerId: data.stripe_customer_id,
  };
}

export async function updateLibraryDetails(
  libraryId: string,
  updates: {
    name?: string;
    description?: string;
    selectedPlaylistIds?: string[];
    trackDisplayPrefs?: TrackDisplayPrefs;
    librarySettings?: LibrarySettings;
  },
  _options?: { asOwner?: boolean }
): Promise<USBLibrary> {
  const patch: Record<string, unknown> = {};
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.selectedPlaylistIds !== undefined) {
    patch.selected_playlist_ids = updates.selectedPlaylistIds;
  }
  if (updates.trackDisplayPrefs !== undefined) {
    patch.track_display_prefs = normalizeTrackDisplayPrefs(updates.trackDisplayPrefs);
  }
  if (updates.librarySettings !== undefined) {
    patch.library_settings = updates.librarySettings;
  }

  const { error } = await supabase.from('libraries').update(patch).eq('id', libraryId);
  if (error) throw new Error(error.message);
  return fetchLibrary(libraryId);
}

export async function uploadLogo(userId: string, blob: Blob, ext = 'jpg'): Promise<string> {
  const path = `${userId}/logo-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('logos').upload(path, blob, {
    upsert: true,
    contentType: blob.type || `image/${ext}`,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadStartImage(userId: string, blob: Blob, ext = 'jpg'): Promise<string> {
  const path = `${userId}/start-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('logos').upload(path, blob, {
    upsert: true,
    contentType: blob.type || `image/${ext}`,
  });
  if (error) throw new Error(error.message);
  return path;
}

export async function clearLibraryCatalog(libraryId: string): Promise<void> {
  const { error } = await supabase
    .from('libraries')
    .update({
      tracks: [],
      playlists: [],
      playlist_tree: null,
      selected_playlist_ids: null,
      track_count: 0,
      playlist_count: 0,
      description: 'Upload je Rekordbox XML om te starten.',
    })
    .eq('id', libraryId);
  if (error) throw new Error(error.message);

  await supabase.from('requests').delete().eq('library_id', libraryId);
}

export async function fetchRequests(libraryId: string): Promise<TrackRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('API error voor verzoekjes:', error);
    return [];
  }
  return (data || []).map(mapRequest);
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
  return mapRequest(data);
}

export async function updateRequestStatus(
  libraryId: string,
  requestId: string,
  status: string,
  _options?: { asOwner?: boolean }
): Promise<TrackRequest> {
  const { data, error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId)
    .eq('library_id', libraryId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapRequest(data);
}

export async function deleteRequest(
  libraryId: string,
  requestId: string,
  _options?: { asOwner?: boolean }
): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', requestId)
    .eq('library_id', libraryId);
  if (error) throw new Error(error.message);
}

export async function clearAllRequests(
  libraryId: string,
  options?: { asOwner?: boolean; reqIds?: string[] }
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
    const list = await fetchRequests(libraryId);
    onChange(list);
  };

  const channel = supabase
    .channel(`requests:${libraryId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests', filter: `library_id=eq.${libraryId}` },
      () => {
        void reload();
      }
    )
    .subscribe();

  return () => {
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

/** @deprecated Use fetchLibraryBySlug / fetchMyLibrary */
export async function fetchLibraries(): Promise<LibrarySummary[]> {
  return [];
}
