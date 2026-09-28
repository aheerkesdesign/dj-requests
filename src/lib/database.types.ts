export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          slug: string;
          logo_path: string | null;
          start_image_path: string | null;
          socials: Json;
          stripe_customer_id: string | null;
          subscription_status: string;
          plan: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          slug: string;
          logo_path?: string | null;
          start_image_path?: string | null;
          socials?: Json;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          plan?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          slug?: string;
          logo_path?: string | null;
          start_image_path?: string | null;
          socials?: Json;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          plan?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      libraries: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          tracks: Json;
          playlists: Json;
          playlist_tree: Json | null;
          selected_playlist_ids: string[] | null;
          track_count: number;
          playlist_count: number;
          track_display_prefs: Json | null;
          library_settings: Json | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name?: string;
          description?: string;
          tracks?: Json;
          playlists?: Json;
          playlist_tree?: Json | null;
          selected_playlist_ids?: string[] | null;
          track_count?: number;
          playlist_count?: number;
          track_display_prefs?: Json | null;
          library_settings?: Json | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string;
          tracks?: Json;
          playlists?: Json;
          playlist_tree?: Json | null;
          selected_playlist_ids?: string[] | null;
          track_count?: number;
          playlist_count?: number;
          track_display_prefs?: Json | null;
          library_settings?: Json | null;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      library_tracks: {
        Row: {
          library_id: string;
          track_key: string;
          name: string;
          artist: string;
          playlist_ids: string[] | null;
          data: Json;
        };
        Insert: {
          library_id: string;
          track_key: string;
          name?: string;
          artist?: string;
          playlist_ids?: string[] | null;
          data: Json;
        };
        Update: {
          library_id?: string;
          track_key?: string;
          name?: string;
          artist?: string;
          playlist_ids?: string[] | null;
          data?: Json;
        };
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          library_id: string;
          title: string;
          artist: string;
          kind: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          library_id: string;
          title: string;
          artist: string;
          kind?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          library_id?: string;
          title?: string;
          artist?: string;
          kind?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_my_profile: { Args: Record<string, never>; Returns: undefined };
      library_has_track: {
        Args: { p_library_id: string; p_title: string; p_artist: string };
        Returns: boolean;
      };
      match_request_tracks: {
        Args: { p_library_id: string; p_requests: Json };
        Returns: Json;
      };
      search_library_tracks: {
        Args: {
          p_library_id: string;
          p_query?: string;
          p_playlist_ids?: string[] | null;
          p_sort?: string;
          p_order?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      request_status: 'pending' | 'played' | 'declined';
    };
    CompositeTypes: Record<string, never>;
  };
}
