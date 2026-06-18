-- Career Workbench baseline schema.
-- This file squashes the previously separate setup SQL scripts into one
-- rebuildable baseline for fresh Supabase projects and local db reset.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  has_completed_onboarding boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id),
  constraint profiles_profile_data_object_check
    check (jsonb_typeof(profile_data) = 'object')
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  source_type text not null default 'manual_created',
  document_json jsonb not null default '{}'::jsonb,
  style_json jsonb not null default '{}'::jsonb,
  ai_parsed_draft_json jsonb,
  source_context_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resumes_source_type_check
    check (source_type in (
      'manual_created',
      'manual_upload',
      'ai_generated',
      'target_job'
    )),
  constraint resumes_document_json_object_check
    check (jsonb_typeof(document_json) = 'object'),
  constraint resumes_style_json_object_check
    check (jsonb_typeof(style_json) = 'object'),
  constraint resumes_source_context_json_object_check
    check (jsonb_typeof(source_context_json) = 'object')
);

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  source_platform text,
  source_url text,
  company text not null,
  title text not null,
  logo_url text,
  company_info text,
  location text,
  remote_status text not null default 'onsite',
  job_type text not null default 'full_time',
  years_required text,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  salary_range text,
  posted_at timestamptz,
  summary text,
  imported_by text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_descriptions_remote_status_check
    check (remote_status in ('remote', 'hybrid', 'onsite')),
  constraint job_descriptions_job_type_check
    check (job_type in ('full_time', 'contract', 'part_time'))
);

create table if not exists public.match_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid not null references public.job_descriptions(id) on delete cascade,
  status text not null default 'pending',
  report_json jsonb,
  profile_snapshot_at timestamptz,
  job_snapshot_at timestamptz,
  external_run_id text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_reports_status_check
    check (status in ('pending', 'succeeded', 'failed')),
  constraint match_reports_report_json_object_check
    check (report_json is null or jsonb_typeof(report_json) = 'object'),
  constraint match_reports_user_job_unique unique (user_id, job_id)
);

create index if not exists profiles_user_updated_idx
  on public.profiles (user_id, updated_at desc);

create index if not exists resumes_user_updated_idx
  on public.resumes (user_id, updated_at desc);

create index if not exists job_descriptions_active_created_idx
  on public.job_descriptions (is_active, created_at desc);

create index if not exists match_reports_user_updated_idx
  on public.match_reports (user_id, updated_at desc);

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.users where id = auth.uid()),
    false
  );
$$;

revoke all on function private.is_current_user_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_current_user_admin() to authenticated;

alter table public.users enable row level security;
alter table public.users force row level security;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

alter table public.resumes enable row level security;
alter table public.resumes force row level security;

alter table public.job_descriptions enable row level security;
alter table public.job_descriptions force row level security;

alter table public.match_reports enable row level security;
alter table public.match_reports force row level security;

grant usage on schema public to authenticated;

revoke all on table public.users from anon;
revoke all on table public.users from authenticated;
grant select, insert, update on table public.users to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

revoke all on table public.resumes from anon;
revoke all on table public.resumes from authenticated;
grant select, insert, update, delete on table public.resumes to authenticated;

revoke all on table public.job_descriptions from anon;
revoke all on table public.job_descriptions from authenticated;
grant select, insert, update on table public.job_descriptions to authenticated;

revoke all on table public.match_reports from anon;
revoke all on table public.match_reports from authenticated;
grant select, insert, update, delete on table public.match_reports to authenticated;

create policy "users_select_own"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

create policy "users_insert_own"
on public.users
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "users_update_own"
on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "resumes_select_own"
on public.resumes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "resumes_insert_own"
on public.resumes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "resumes_update_own"
on public.resumes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "resumes_delete_own"
on public.resumes
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "job_descriptions_select_active"
on public.job_descriptions
for select
to authenticated
using (is_active);

create policy "job_descriptions_admin_select_all"
on public.job_descriptions
for select
to authenticated
using (private.is_current_user_admin());

create policy "job_descriptions_admin_insert"
on public.job_descriptions
for insert
to authenticated
with check (private.is_current_user_admin());

create policy "job_descriptions_admin_update"
on public.job_descriptions
for update
to authenticated
using (private.is_current_user_admin())
with check (private.is_current_user_admin());

create policy "match_reports_select_own"
on public.match_reports
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "match_reports_insert_own"
on public.match_reports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "match_reports_update_own"
on public.match_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "match_reports_delete_own"
on public.match_reports
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values
  ('company-logos', 'company-logos', true),
  ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = excluded.public;

create policy "company_logos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'company-logos');

create policy "company_logos_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-logos' and private.is_current_user_admin()
);

create policy "company_logos_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'company-logos' and private.is_current_user_admin())
with check (bucket_id = 'company-logos' and private.is_current_user_admin());

create policy "company_logos_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'company-logos' and private.is_current_user_admin());

create policy "profile_avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'profile-avatars');

create policy "profile_avatars_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

comment on table public.users is
  'Business-facing user account rows keyed by auth.users.id. Stores app user basics and onboarding state only.';

comment on column public.users.is_admin is
  'Manually flagged admins may import / edit / deactivate job_descriptions. No admin UI; set directly in the database.';

comment on table public.profiles is
  'Career profile records keyed to public.users. Stores long-lived ProfileDraft data separately from account basics and resumes.';

comment on column public.profiles.profile_data is
  'ProfileDraft JSON from @career-workbench/domain.';

comment on table public.resumes is
  'MVP editable resume records. The canonical resume state is document_json plus style_json; file storage, versions, patch logs, and conversations are deferred.';

comment on column public.resumes.document_json is
  'ResumeDocument JSON from @career-workbench/domain.';

comment on column public.resumes.style_json is
  'ResumeStyleConfig JSON from @career-workbench/domain.';

comment on column public.resumes.ai_parsed_draft_json is
  'Optional AIParsedResumeDraft JSON kept only for parsing debug and review.';

comment on column public.resumes.source_context_json is
  'Optional source metadata such as upload, target job, or generation context.';

comment on table public.job_descriptions is
  'Admin-imported job postings with structured JD fields.';

comment on column public.job_descriptions.logo_url is
  'Public Supabase Storage URL for the company logo; null falls back to a derived letter avatar.';

comment on column public.job_descriptions.is_active is
  'Inactive jobs are hidden from user-facing lists but kept for audit.';

comment on table public.match_reports is
  'On-demand AI narrative match analysis per (user, job). Narrative only (evidence/gaps/risks/aiNote); match scores stay rule-computed and are never stored. Upsert in place, no history.';

comment on column public.match_reports.report_json is
  'job_match workflow narrative output: evidence, gaps, risks, ai_note. No score fields.';

comment on column public.match_reports.profile_snapshot_at is
  'profiles.updated_at captured when the analysis ran; used for staleness checks.';

comment on column public.match_reports.job_snapshot_at is
  'job_descriptions.updated_at captured when the analysis ran; used for staleness checks.';

comment on column public.match_reports.external_run_id is
  'Dify workflow_run_id as plain text for debugging only. No foreign key, no ExternalAiRun table in MVP.';

notify pgrst, 'reload schema';
