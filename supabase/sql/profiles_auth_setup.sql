-- Career Workbench Auth/user/profile bootstrap.
-- Run this before enabling real persisted user data.

-- Legacy compatibility: older setup used public.profiles as the account table
-- and stored ProfileDraft in profiles.profile_data. Rename that table to users
-- before creating the new business-level public.profiles table.
do $$
begin
  if to_regclass('public.users') is null
     and to_regclass('public.profiles') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'profiles'
         and column_name = 'has_completed_onboarding'
     ) then
    alter table public.profiles rename to users;
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  has_completed_onboarding boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists email text;

alter table public.users
  add column if not exists full_name text;

alter table public.users
  add column if not exists avatar_url text;

alter table public.users
  add column if not exists has_completed_onboarding boolean not null default false;

alter table public.users
  add column if not exists created_at timestamptz not null default now();

alter table public.users
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  profile_data jsonb not null default '{}'::jsonb,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_user_id_unique unique (user_id)
);

alter table public.profiles
  add column if not exists user_id uuid references public.users(id) on delete cascade;

alter table public.profiles
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists source text not null default 'manual';

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  alter column user_id set not null,
  alter column profile_data set not null;

alter table public.profiles
  drop constraint if exists profiles_user_id_unique;

alter table public.profiles
  add constraint profiles_user_id_unique unique (user_id);

alter table public.profiles
  drop constraint if exists profiles_profile_data_object_check;

alter table public.profiles
  add constraint profiles_profile_data_object_check
  check (jsonb_typeof(profile_data) = 'object');

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'profile_data'
  ) then
    execute '
      insert into public.profiles (user_id, profile_data, source, created_at, updated_at)
      select id, coalesce(profile_data, ''{}''::jsonb), ''legacy_profile_data'', created_at, updated_at
      from public.users
      on conflict (user_id) do update
      set profile_data = excluded.profile_data,
          updated_at = excluded.updated_at
    ';

    alter table public.users drop column profile_data;
  end if;
end $$;

alter table public.users enable row level security;
alter table public.users force row level security;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

grant usage on schema public to authenticated;

revoke all on table public.users from anon;
revoke all on table public.users from authenticated;
grant select, insert, update on table public.users to authenticated;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

drop policy if exists "profiles_select_own" on public.users;
drop policy if exists "profiles_insert_own" on public.users;
drop policy if exists "profiles_update_own" on public.users;
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
on public.users
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
on public.users
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists profiles_user_updated_idx
  on public.profiles (user_id, updated_at desc);

comment on table public.users is
  'Business-facing user account rows keyed by auth.users.id. Stores app user basics and onboarding state only.';

comment on table public.profiles is
  'Career profile records keyed to public.users. Stores long-lived ProfileDraft data separately from account basics and resumes.';

comment on column public.profiles.profile_data is
  'ProfileDraft JSON from @career-workbench/domain.';

notify pgrst, 'reload schema';
