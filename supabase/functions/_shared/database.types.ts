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
          style_json?: unknown;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      job_descriptions: {
        Row: {
          company: string;
          id: string;
          job_type: string;
          location: string | null;
          preferred_skills: string[] | null;
          remote_status: string;
          required_skills: string[] | null;
          requirements: string[] | null;
          responsibilities: string[] | null;
          salary_range: string | null;
          seniority: string | null;
          summary: string | null;
          title: string;
          updated_at: string | null;
          years_required: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      match_reports: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          external_run_id: string | null;
          id: string;
          job_id: string;
          job_snapshot_at: string | null;
          profile_snapshot_at: string | null;
          report_json: unknown;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          error_message?: string | null;
          external_run_id?: string | null;
          job_id: string;
          job_snapshot_at?: string | null;
          profile_snapshot_at?: string | null;
          report_json?: unknown;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          error_message?: string | null;
          external_run_id?: string | null;
          job_id?: string;
          job_snapshot_at?: string | null;
          profile_snapshot_at?: string | null;
          report_json?: unknown;
          status?: string;
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
