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
export type RequestSortBy =
  | 'order'
  | 'title'
  | 'artist'
  | keyof TrackFieldVisibility;

const VALID_REQUEST_SORTS = new Set<string>([
  'order',
  'title',
  'artist',
  'album',
  'bpm',
  'key',
  'genre',
  'duration',
  'year',
]);

export function normalizeRequestSortBy(value: unknown): RequestSortBy {
  return typeof value === 'string' && VALID_REQUEST_SORTS.has(value)
    ? (value as RequestSortBy)
    : 'order';
}

export type RequestButtonStyle = 'text' | 'icon';

export function normalizeRequestButtonStyle(value: unknown): RequestButtonStyle {
  return value === 'icon' ? 'icon' : 'text';
}

export interface LibrarySettings {
  enableDownloadRequests: boolean;
  /** When true, guests see the start screen before the library. */
  showStartScreen: boolean;
  /** When true, guests can see played/declined requests. */
  showPlayedDeclinedToGuests: boolean;
  /** When true, show DJ instructional tips (swipe hint, download hint, upload how-to). */
  showDjTips: boolean;
  pageDefaultLocale: 'nl' | 'en' | 'auto';
  /** DJ requests-tab sort preference (synced via library_settings). */
  requestSortBy: RequestSortBy;
  /** Track-card request control: labeled button or icon-only. */
  requestButtonStyle: RequestButtonStyle;
}

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  enableDownloadRequests: true,
  showStartScreen: true,
  showPlayedDeclinedToGuests: true,
  showDjTips: true,
  pageDefaultLocale: 'auto',
  requestSortBy: 'order',
  requestButtonStyle: 'text',
};

/** Prefer new show* keys; fall back to inverting legacy hide/skip keys. */
function resolveShowSetting(
  showValue: unknown,
  legacyHideValue: unknown,
  defaultShow = true
): boolean {
  if (typeof showValue === 'boolean') return showValue;
  if (typeof legacyHideValue === 'boolean') return !legacyHideValue;
  return defaultShow;
}

export function normalizeLibrarySettings(raw: unknown): LibrarySettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    enableDownloadRequests: src.enableDownloadRequests !== false,
    showStartScreen: resolveShowSetting(src.showStartScreen, src.skipStartScreen),
    showPlayedDeclinedToGuests: resolveShowSetting(
      src.showPlayedDeclinedToGuests,
      src.hidePlayedDeclinedFromGuests
    ),
    showDjTips: resolveShowSetting(src.showDjTips, src.hideDjTips),
    pageDefaultLocale:
      src.pageDefaultLocale === 'nl' || src.pageDefaultLocale === 'en'
        ? src.pageDefaultLocale
        : 'auto',
    requestSortBy: normalizeRequestSortBy(src.requestSortBy),
    requestButtonStyle: normalizeRequestButtonStyle(src.requestButtonStyle),
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
