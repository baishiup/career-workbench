-- Career Workbench admin job import (工作机会 任务 2).
-- Run after jobs_setup.sql. Adds users.is_admin, migrates the import_method
-- enum to manual_form / manual_text / screenshot, and opens admin-only
-- insert / update / full-select access on job_descriptions via RLS.
-- Admins are flagged manually in the database; there is no admin UI for it:
--   update public.users set is_admin = true where email = '...';

alter table public.users
  add column if not exists is_admin boolean not null default false;

create schema if not exists private;
revoke all on schema private from public;

-- security definer helper so job policies can check admin status without
-- being blocked by the owner-only RLS on public.users. Keep it out of the
-- exposed public schema so it cannot become a public RPC endpoint.
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

-- import_method migration: link scraping (job_url) is out of scope, fold any
-- existing rows into manual_text and introduce manual_form for pure form input.
alter table public.job_descriptions
  drop constraint if exists job_descriptions_import_method_check;

update public.job_descriptions
  set import_method = 'manual_text'
  where import_method = 'job_url';

alter table public.job_descriptions
  add constraint job_descriptions_import_method_check
  check (import_method in ('manual_form', 'manual_text', 'screenshot'));

grant insert, update on table public.job_descriptions to authenticated;

-- Admins can also read inactive jobs so they can re-enable or edit them.
-- Policies are permissive, so normal users still match the active-only policy.
drop policy if exists "job_descriptions_admin_select_all" on public.job_descriptions;
create policy "job_descriptions_admin_select_all"
on public.job_descriptions
for select
to authenticated
using (private.is_current_user_admin());

drop policy if exists "job_descriptions_admin_insert" on public.job_descriptions;
create policy "job_descriptions_admin_insert"
on public.job_descriptions
for insert
to authenticated
with check (private.is_current_user_admin());

drop policy if exists "job_descriptions_admin_update" on public.job_descriptions;
create policy "job_descriptions_admin_update"
on public.job_descriptions
for update
to authenticated
using (private.is_current_user_admin())
with check (private.is_current_user_admin());

drop function if exists public.is_current_user_admin();

comment on column public.users.is_admin is
  'Manually flagged admins may import / edit / deactivate job_descriptions. No admin UI; set directly in the database.';

comment on column public.job_descriptions.import_method is
  'How the job entered the system: manual_form, manual_text, or screenshot.';

notify pgrst, 'reload schema';
