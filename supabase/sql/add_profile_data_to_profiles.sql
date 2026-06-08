-- Add the Profile page snapshot column to the business profile table.
-- In the current model, public.users stores account basics and public.profiles
-- stores ProfileDraft data with a user_id foreign key.

alter table public.profiles
  add column if not exists profile_data jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists source text not null default 'manual';

notify pgrst, 'reload schema';
