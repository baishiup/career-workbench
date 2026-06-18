-- Sync remote schema with merged code (idempotent).
--   1) profiles: drop legacy snapshot `source` column (profile model refactor).
--   2) job_descriptions: add logo_url/company_info, drop company_stage/seniority/
--      import_method (feat: job).
--   3) company-logos storage bucket + RLS (depends on private.is_current_user_admin()).
-- Safe to re-run; now covered by the baseline schema for fresh databases.

-- 1) profiles
alter table public.profiles
  drop column if exists source;

-- 2) job_descriptions
alter table public.job_descriptions
  add column if not exists logo_url text;

alter table public.job_descriptions
  add column if not exists company_info text;

alter table public.job_descriptions
  drop constraint if exists job_descriptions_import_method_check;

alter table public.job_descriptions
  drop column if exists company_stage,
  drop column if exists seniority,
  drop column if exists import_method;

-- 3) company-logos storage
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "company_logos_public_read" on storage.objects;
create policy "company_logos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'company-logos');

drop policy if exists "company_logos_admin_insert" on storage.objects;
create policy "company_logos_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-logos' and private.is_current_user_admin()
);

drop policy if exists "company_logos_admin_update" on storage.objects;
create policy "company_logos_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'company-logos' and private.is_current_user_admin())
with check (bucket_id = 'company-logos' and private.is_current_user_admin());

drop policy if exists "company_logos_admin_delete" on storage.objects;
create policy "company_logos_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'company-logos' and private.is_current_user_admin());

notify pgrst, 'reload schema';
