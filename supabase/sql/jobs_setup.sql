-- Career Workbench job descriptions (工作机会 任务 1).
-- Run after profiles_auth_setup.sql. Jobs are admin-imported shared data:
-- authenticated users can read active jobs only. No write policies yet;
-- writes go through service role until the admin import task adds policies.

create table if not exists public.job_descriptions (
  id uuid primary key default gen_random_uuid(),
  source_platform text,
  source_url text,
  company text not null,
  title text not null,
  company_stage text,
  location text,
  remote_status text not null default 'onsite',
  job_type text not null default 'full_time',
  seniority text,
  years_required text,
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  salary_range text,
  posted_at timestamptz,
  summary text,
  imported_by text,
  import_method text not null default 'manual_text',
  import_status text not null default 'parsed',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_descriptions
  add column if not exists source_platform text;

alter table public.job_descriptions
  add column if not exists source_url text;

alter table public.job_descriptions
  add column if not exists company text;

alter table public.job_descriptions
  add column if not exists title text;

alter table public.job_descriptions
  add column if not exists company_stage text;

alter table public.job_descriptions
  add column if not exists location text;

alter table public.job_descriptions
  add column if not exists remote_status text not null default 'onsite';

alter table public.job_descriptions
  add column if not exists job_type text not null default 'full_time';

alter table public.job_descriptions
  add column if not exists seniority text;

alter table public.job_descriptions
  add column if not exists years_required text;

alter table public.job_descriptions
  add column if not exists required_skills text[] not null default '{}';

alter table public.job_descriptions
  add column if not exists preferred_skills text[] not null default '{}';

alter table public.job_descriptions
  add column if not exists responsibilities text[] not null default '{}';

alter table public.job_descriptions
  add column if not exists requirements text[] not null default '{}';

alter table public.job_descriptions
  add column if not exists salary_range text;

alter table public.job_descriptions
  add column if not exists posted_at timestamptz;

alter table public.job_descriptions
  add column if not exists summary text;

alter table public.job_descriptions
  add column if not exists imported_by text;

alter table public.job_descriptions
  add column if not exists import_method text not null default 'manual_text';

alter table public.job_descriptions
  add column if not exists import_status text not null default 'parsed';

alter table public.job_descriptions
  add column if not exists is_active boolean not null default true;

alter table public.job_descriptions
  add column if not exists created_at timestamptz not null default now();

alter table public.job_descriptions
  add column if not exists updated_at timestamptz not null default now();

alter table public.job_descriptions
  alter column company set not null,
  alter column title set not null;

alter table public.job_descriptions
  drop constraint if exists job_descriptions_remote_status_check;

alter table public.job_descriptions
  add constraint job_descriptions_remote_status_check
  check (remote_status in ('remote', 'hybrid', 'onsite'));

alter table public.job_descriptions
  drop constraint if exists job_descriptions_job_type_check;

alter table public.job_descriptions
  add constraint job_descriptions_job_type_check
  check (job_type in ('full_time', 'contract', 'part_time'));

alter table public.job_descriptions
  drop constraint if exists job_descriptions_import_method_check;

alter table public.job_descriptions
  add constraint job_descriptions_import_method_check
  check (import_method in ('manual_text', 'job_url', 'screenshot'));

alter table public.job_descriptions
  drop constraint if exists job_descriptions_import_status_check;

alter table public.job_descriptions
  add constraint job_descriptions_import_status_check
  check (import_status in ('parsed', 'needs_review', 'parse_failed'));

create index if not exists job_descriptions_active_created_idx
  on public.job_descriptions (is_active, created_at desc);

alter table public.job_descriptions enable row level security;
alter table public.job_descriptions force row level security;

grant usage on schema public to authenticated;

revoke all on table public.job_descriptions from anon;
revoke all on table public.job_descriptions from authenticated;
grant select on table public.job_descriptions to authenticated;

drop policy if exists "job_descriptions_select_active" on public.job_descriptions;
create policy "job_descriptions_select_active"
on public.job_descriptions
for select
to authenticated
using (is_active);

comment on table public.job_descriptions is
  'Admin-imported job postings with structured JD fields. Read-only for normal users; write policies arrive with the admin import task.';

comment on column public.job_descriptions.import_method is
  'How the job entered the system: manual_text, job_url, or screenshot.';

comment on column public.job_descriptions.import_status is
  'Parse pipeline state: parsed, needs_review, or parse_failed.';

comment on column public.job_descriptions.is_active is
  'Inactive jobs are hidden from user-facing lists but kept for audit.';

notify pgrst, 'reload schema';
