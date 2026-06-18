/**
 * 内存数据库的行类型，字段与 Supabase Postgres（snake_case）对齐。
 *
 * 这些是 PostgREST handler 直接吐回的「数据库行」，web 侧各 API 的
 * mapJobRow / toProfile 等会原样消费，因此命名必须和真实表一致。
 */

import type { ProfileDraft, ResumeDocument, ResumeStyleConfig } from "@career-workbench/domain";

export type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  has_completed_onboarding: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  user_id: string;
  profile_data: ProfileDraft | null;
  created_at: string;
  updated_at: string;
};

export type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  source_type: string;
  document_json: ResumeDocument | null;
  style_json: ResumeStyleConfig | null;
  source_context_json: unknown | null;
  created_at: string;
  updated_at: string;
};

export type JobDescriptionRow = {
  id: string;
  source_platform: string | null;
  source_url: string | null;
  company: string;
  title: string;
  logo_url: string | null;
  company_info: string | null;
  location: string | null;
  remote_status: string;
  job_type: string;
  years_required: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  requirements: string[];
  salary_range: string | null;
  posted_at: string | null;
  summary: string | null;
  imported_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MatchReportRow = {
  id: string;
  user_id: string;
  job_id: string;
  status: string;
  report_json: unknown | null;
  profile_snapshot_at: string | null;
  job_snapshot_at: string | null;
  external_run_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

/** 表名 → 行类型映射；store 与 handler 都以此为单一事实源。 */
export type Database = {
  users: UserRow[];
  profiles: ProfileRow[];
  resumes: ResumeRow[];
  job_descriptions: JobDescriptionRow[];
  match_reports: MatchReportRow[];
};

export type TableName = keyof Database;

/** 各表的主键列；upsert / update / delete 命中行靠它。 */
export const TABLE_PRIMARY_KEY: Record<TableName, string> = {
  users: "id",
  profiles: "user_id",
  resumes: "id",
  job_descriptions: "id",
  match_reports: "id",
};

export const TABLE_NAMES = Object.keys(TABLE_PRIMARY_KEY) as TableName[];

/** mock 登录用户的固定 id；seed 的 users / profiles / resumes 都挂在它名下。 */
export const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001";
export const MOCK_USER_EMAIL = "admin@career-workbench.dev";
