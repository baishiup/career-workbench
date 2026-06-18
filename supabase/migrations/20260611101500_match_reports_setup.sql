-- Career Workbench match reports (工作机会 任务 5).
-- Historical follow-up migration after the baseline schema. Stores on-demand AI
-- narrative analysis (evidence / gaps / risks / aiNote) per (user, job).
-- Scores stay rule-computed and are never persisted here. One row per
-- (user_id, job_id); re-running analysis upserts in place, no history kept.

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
  updated_at timestamptz not null default now()
);

alter table public.match_reports
  add column if not exists status text not null default 'pending';

alter table public.match_reports
  add column if not exists report_json jsonb;

alter table public.match_reports
  add column if not exists profile_snapshot_at timestamptz;

alter table public.match_reports
  add column if not exists job_snapshot_at timestamptz;

alter table public.match_reports
  add column if not exists external_run_id text;

alter table public.match_reports
  add column if not exists error_message text;

alter table public.match_reports
  add column if not exists created_at timestamptz not null default now();

alter table public.match_reports
  add column if not exists updated_at timestamptz not null default now();

alter table public.match_reports
  drop constraint if exists match_reports_status_check;

alter table public.match_reports
  add constraint match_reports_status_check
  check (status in ('pending', 'succeeded', 'failed'));

alter table public.match_reports
  drop constraint if exists match_reports_report_json_object_check;

alter table public.match_reports
  add constraint match_reports_report_json_object_check
  check (report_json is null or jsonb_typeof(report_json) = 'object');

alter table public.match_reports
  drop constraint if exists match_reports_user_job_unique;

alter table public.match_reports
  add constraint match_reports_user_job_unique unique (user_id, job_id);

create index if not exists match_reports_user_updated_idx
  on public.match_reports (user_id, updated_at desc);

alter table public.match_reports enable row level security;
alter table public.match_reports force row level security;

grant usage on schema public to authenticated;

revoke all on table public.match_reports from anon;
revoke all on table public.match_reports from authenticated;
grant select, insert, update, delete on table public.match_reports to authenticated;

drop policy if exists "match_reports_select_own" on public.match_reports;
create policy "match_reports_select_own"
on public.match_reports
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "match_reports_insert_own" on public.match_reports;
create policy "match_reports_insert_own"
on public.match_reports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "match_reports_update_own" on public.match_reports;
create policy "match_reports_update_own"
on public.match_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "match_reports_delete_own" on public.match_reports;
create policy "match_reports_delete_own"
on public.match_reports
for delete
to authenticated
using ((select auth.uid()) = user_id);

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
