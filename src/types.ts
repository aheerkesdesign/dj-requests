export interface Track {
  id: string;
  trackId: string;
  name: string;
  artist: string;
  composer?: string;
  album?: string;
  genre?: string;
  bpm: number;
  key: string;
  duration: number;
  durationFormatted: string;
  year?: string;
  comments?: string;
  rating?: number;
  dateAdded?: string;
  playlists: string[];
  bitrate?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  trackIds: string[];
}

export interface PlaylistNode {
  id: string;
  name: string;
  type: 'folder' | 'playlist';
  playlistId?: string;
  trackCount?: number;
  trackIds?: string[];
  children?: PlaylistNode[];
}

export type RequestStatus = 'pending' | 'played' | 'declined';
export type RequestKind = 'playable' | 'wishlist';

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface TrackRequest {
  id: string;
  libraryId: string;
  title: string;
  artist: string;
  kind: RequestKind;
  status: RequestStatus;
  createdAt: string;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
  x?: string;
  spotify?: string;
  soundcloud?: string;
  mixcloud?: string;
  website?: string;
}

/** Optional track fields; title and artist are always shown. */
export interface TrackFieldVisibility {
  album: boolean;
  bpm: boolean;
  key: boolean;
  genre: boolean;
  duration: boolean;
  year: boolean;
}

export interface TrackDisplayPrefs {
  dj: TrackFieldVisibility;
  viewers: TrackFieldVisibility;
}

export const DEFAULT_TRACK_FIELD_VISIBILITY: TrackFieldVisibility = {
  album: false,
  bpm: false,
  key: false,
  genre: false,
  duration: false,
  year: false,
};

export const DEFAULT_TRACK_DISPLAY_PREFS: TrackDisplayPrefs = {
  dj: { ...DEFAULT_TRACK_FIELD_VISIBILITY },
  viewers: { ...DEFAULT_TRACK_FIELD_VISIBILITY },
};

export function normalizeTrackDisplayPrefs(raw: unknown): TrackDisplayPrefs {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<TrackDisplayPrefs>;
  const pick = (side: Partial<TrackFieldVisibility> | undefined): TrackFieldVisibility => ({
    album: Boolean(side?.album),
    bpm: Boolean(side?.bpm),
    key: Boolean(side?.key),
    genre: Boolean(side?.genre),
    duration: Boolean(side?.duration),
    year: Boolean(side?.year),
  });
  return {
    dj: pick(src.dj),
    viewers: pick(src.viewers),
  };
}

/** Library-level behavior settings (request controls, guest experience, language). */
export interface LibrarySettings {
  enableDownloadRequests: boolean;
  skipStartScreen: boolean;
  hidePlayedDeclinedFromGuests: boolean;
  /** When true, hide DJ instructional tips (swipe hint, download hint, upload how-to). */
  hideDjTips: boolean;
  pageDefaultLocale: 'nl' | 'en' | 'auto';
}

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  enableDownloadRequests: true,
  skipStartScreen: false,
  hidePlayedDeclinedFromGuests: false,
  hideDjTips: false,
  pageDefaultLocale: 'auto',
};

export function normalizeLibrarySettings(raw: unknown): LibrarySettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<LibrarySettings>;
  return {
    enableDownloadRequests: src.enableDownloadRequests !== false,
    skipStartScreen: Boolean(src.skipStartScreen),
    hidePlayedDeclinedFromGuests: Boolean(src.hidePlayedDeclinedFromGuests),
    hideDjTips: Boolean(src.hideDjTips),
    pageDefaultLocale:
      src.pageDefaultLocale === 'nl' || src.pageDefaultLocale === 'en'
        ? src.pageDefaultLocale
        : 'auto',
  };
}

export interface Profile {
  id: string;
  displayName: string;
  slug: string;
  logoPath?: string | null;
  logoUrl?: string;
  startImagePath?: string | null;
  startImageUrl?: string;
  socials?: SocialLinks;
  subscriptionStatus: SubscriptionStatus;
  plan?: string | null;
  currentPeriodEnd?: string | null;
  stripeCustomerId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface USBLibrary {
  id: string;
  ownerId?: string;
  slug?: string;
  name: string;
  djName: string;
  logoUrl?: string;
  startImageUrl?: string;
  socials?: SocialLinks;
  description: string;
  trackCount: number;
  playlistCount: number;
  updatedAt: string;
  tracks: Track[];
  playlists: Playlist[];
  playlistTree?: PlaylistNode[];
  selectedPlaylistIds?: string[];
  trackDisplayPrefs?: TrackDisplayPrefs;
  librarySettings?: LibrarySettings;
  subscriptionStatus?: SubscriptionStatus;
}
