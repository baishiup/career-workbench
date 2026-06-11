/**
 * Edge Function local database typing.
 *
 * Keep this narrow until generated Supabase types are introduced. It only covers
 * the tables touched by the current resume upload/onboarding functions.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          profile_data: unknown;
          source: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          profile_data?: unknown;
          source?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          profile_data?: unknown;
          source?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      resumes: {
        Row: {
          ai_parsed_draft_json: unknown;
          created_at: string | null;
          document_json: unknown;
          id: string;
          source_context_json: unknown;
          source_type: string;
          status: string;
          style_json: unknown;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          ai_parsed_draft_json?: unknown;
          document_json: unknown;
          source_context_json?: unknown;
          source_type: string;
          status: string;
          style_json: unknown;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          ai_parsed_draft_json?: unknown;
          document_json?: unknown;
          source_context_json?: unknown;
          source_type?: string;
          status?: string;
          style_json?: unknown;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          email: string | null;
          full_name: string | null;
          has_completed_onboarding: boolean;
          id: string;
          is_admin: boolean;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          email?: string | null;
          full_name?: string | null;
          has_completed_onboarding?: boolean;
          id: string;
          is_admin?: boolean;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          email?: string | null;
          full_name?: string | null;
          has_completed_onboarding?: boolean;
          id?: string;
          is_admin?: boolean;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
