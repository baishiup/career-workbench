-- Career Workbench MVP resume persistence.
-- Run this after profiles_auth_setup.sql. This stage stores only editable
-- resume document/style data; files, versions, AI patches, logs, and
-- conversations are intentionally deferred.

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
  updated_at timestamptz not null default now()
);

alter table public.resumes
  add column if not exists user_id uuid references public.users(id) on delete cascade;

alter table public.resumes
  add column if not exists title text;

alter table public.resumes
  add column if not exists source_type text not null default 'manual_created';

alter table public.resumes
  add column if not exists document_json jsonb not null default '{}'::jsonb;

alter table public.resumes
  add column if not exists style_json jsonb not null default '{}'::jsonb;

alter table public.resumes
  add column if not exists ai_parsed_draft_json jsonb;

alter table public.resumes
  add column if not exists source_context_json jsonb not null default '{}'::jsonb;

alter table public.resumes
  add column if not exists created_at timestamptz not null default now();

alter table public.resumes
  add column if not exists updated_at timestamptz not null default now();

alter table public.resumes
  alter column user_id set not null,
  alter column title set not null;

alter table public.resumes
  drop constraint if exists resumes_source_type_check;

alter table public.resumes
  add constraint resumes_source_type_check
  check (source_type in (
    'manual_created',
    'manual_upload',
    'ai_generated',
    'target_job'
  ));

alter table public.resumes
  drop constraint if exists resumes_document_json_object_check;

alter table public.resumes
  add constraint resumes_document_json_object_check
  check (jsonb_typeof(document_json) = 'object');

alter table public.resumes
  drop constraint if exists resumes_style_json_object_check;

alter table public.resumes
  add constraint resumes_style_json_object_check
  check (jsonb_typeof(style_json) = 'object');

alter table public.resumes
  drop constraint if exists resumes_source_context_json_object_check;

alter table public.resumes
  add constraint resumes_source_context_json_object_check
  check (jsonb_typeof(source_context_json) = 'object');

create index if not exists resumes_user_updated_idx
  on public.resumes (user_id, updated_at desc);

alter table public.resumes enable row level security;
alter table public.resumes force row level security;

grant usage on schema public to authenticated;

revoke all on table public.resumes from anon;
revoke all on table public.resumes from authenticated;
grant select, insert, update, delete on table public.resumes to authenticated;

drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own"
on public.resumes
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own"
on public.resumes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own"
on public.resumes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own"
on public.resumes
for delete
to authenticated
using ((select auth.uid()) = user_id);

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

notify pgrst, 'reload schema';
