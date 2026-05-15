-- Migration 002: Saved Client Pet Profiles
-- Adds a saved_pets table so agents can save client pets once and reuse across analyses.

create table if not exists public.saved_pets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_name text,
  name text not null,
  species text not null default 'dog',
  breed text,
  age_category text default 'adult',
  size_category text default 'medium',
  activity_level text default 'moderate',
  indoor_outdoor text default 'both',
  mobility_limitations text,
  anxiety_sensitivity text default 'low',
  escape_risk text default 'low',
  special_notes text,
  photo_url text,
  last_used_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_saved_pets_user on public.saved_pets(user_id);
create index if not exists idx_saved_pets_last_used on public.saved_pets(user_id, last_used_at desc);

create trigger saved_pets_updated_at before update on public.saved_pets
  for each row execute function public.handle_updated_at();

alter table public.saved_pets enable row level security;

create policy "Users can manage own saved pets"
  on public.saved_pets for all using (auth.uid() = user_id);
