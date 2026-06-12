-- Company logo storage for job_descriptions.logo_url (工作机会 logo 上传).
-- Run after jobs_admin_setup.sql (depends on private.is_current_user_admin()).
-- Public read so the avatar renders for everyone; only admins may upload.

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
