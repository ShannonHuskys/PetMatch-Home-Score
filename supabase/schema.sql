-- PetMatch Home Score — Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================================
-- PROPERTIES
-- =============================================================
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  address text not null,
  city text,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  listing_description text,
  beds integer,
  baths numeric(3,1),
  sqft integer,
  lot_size text,
  property_type text default 'single_family',
  stories integer,
  flooring_type text,
  fencing_type text,
  has_mudroom boolean default false,
  has_pet_door boolean default false,
  has_pet_wash_station boolean default false,
  has_screened_porch boolean default false,
  has_pool boolean default false,
  has_built_in_pet_features boolean default false,
  built_in_pet_features_desc text,
  hoa_has_restrictions boolean default false,
  hoa_pet_policy text,
  hoa_breed_restrictions text,
  hoa_pet_limit integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_properties_user on public.properties(user_id);

-- =============================================================
-- PET PROFILES
-- =============================================================
create table public.pet_profiles (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Unnamed Pet',
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_pet_profiles_property on public.pet_profiles(property_id);
create index idx_pet_profiles_user on public.pet_profiles(user_id);

-- =============================================================
-- ANALYSES
-- =============================================================
create table public.analyses (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  overall_score integer,
  traffic_safety_score integer,
  yard_score integer,
  senior_comfort_score integer,
  exercise_score integer,
  indoor_comfort_score integer,
  noise_stress_score integer,
  red_flags_json jsonb default '[]'::jsonb,
  highlights_json jsonb default '[]'::jsonb,
  ai_summary text,
  agent_notes text,
  scoring_details_json jsonb default '{}'::jsonb,
  map_context_json jsonb default '{}'::jsonb,
  species_insights_json jsonb default '{}'::jsonb,
  marketing_tips_json jsonb default '[]'::jsonb,
  upgrade_suggestions_json jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_analyses_property on public.analyses(property_id);
create index idx_analyses_user on public.analyses(user_id);

-- =============================================================
-- ANALYSIS PHOTOS
-- =============================================================
create table public.analysis_photos (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

create index idx_analysis_photos_property on public.analysis_photos(property_id);

-- =============================================================
-- USER SETTINGS
-- =============================================================
create table public.user_settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  default_branding_name text default 'PetMatch Home Score',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_settings_user on public.user_settings(user_id);

-- =============================================================
-- SAVED PETS (reusable client pet profiles)
-- =============================================================
create table public.saved_pets (
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

create index idx_saved_pets_user on public.saved_pets(user_id);
create index idx_saved_pets_last_used on public.saved_pets(user_id, last_used_at desc);

-- =============================================================
-- AUTO-UPDATE TIMESTAMPS
-- =============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_updated_at before update on public.properties
  for each row execute function public.handle_updated_at();

create trigger pet_profiles_updated_at before update on public.pet_profiles
  for each row execute function public.handle_updated_at();

create trigger analyses_updated_at before update on public.analyses
  for each row execute function public.handle_updated_at();

create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.handle_updated_at();

create trigger saved_pets_updated_at before update on public.saved_pets
  for each row execute function public.handle_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.properties enable row level security;
alter table public.pet_profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_photos enable row level security;
alter table public.user_settings enable row level security;
alter table public.saved_pets enable row level security;

create policy "Users can manage own properties"
  on public.properties for all using (auth.uid() = user_id);

create policy "Users can manage own pet profiles"
  on public.pet_profiles for all using (auth.uid() = user_id);

create policy "Users can manage own analyses"
  on public.analyses for all using (auth.uid() = user_id);

create policy "Users can manage own photos"
  on public.analysis_photos for all using (auth.uid() = user_id);

create policy "Users can manage own settings"
  on public.user_settings for all using (auth.uid() = user_id);

create policy "Users can manage own saved pets"
  on public.saved_pets for all using (auth.uid() = user_id);

-- =============================================================
-- STORAGE BUCKET
-- =============================================================
insert into storage.buckets (id, name, public)
values ('analysis-photos', 'analysis-photos', true)
on conflict (id) do nothing;

create policy "Users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'analysis-photos' and auth.role() = 'authenticated');

create policy "Users can view photos"
  on storage.objects for select
  using (bucket_id = 'analysis-photos');

create policy "Users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'analysis-photos' and auth.uid()::text = (storage.foldername(name))[1]);
