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
  rating: number;
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
  spotify?: string;
  soundcloud?: string;
  website?: string;
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
  subscriptionStatus?: SubscriptionStatus;
}

export interface LibrarySummary {
  id: string;
  name: string;
  djName: string;
  slug?: string;
  logoUrl?: string;
  socials?: SocialLinks;
  description: string;
  trackCount: number;
  playlistCount: number;
  updatedAt: string;
}
