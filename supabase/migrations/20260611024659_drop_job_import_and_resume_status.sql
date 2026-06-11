alter table public.job_descriptions
  drop constraint if exists job_descriptions_import_status_check;

alter table public.job_descriptions
  drop column if exists import_status;

alter table public.resumes
  drop constraint if exists resumes_status_check;

drop index if exists public.resumes_user_source_status_idx;

alter table public.resumes
  drop column if exists status;

notify pgrst, 'reload schema';
