-- Migration: Add extended property fields and analysis insight columns
-- This migration adds the pet-specific property columns and the AI insight
-- storage columns that were defined in the TypeScript types but missing from
-- the original schema.

-- Properties: pet-critical features
alter table public.properties add column if not exists stories integer;
alter table public.properties add column if not exists flooring_type text;
alter table public.properties add column if not exists fencing_type text;
alter table public.properties add column if not exists has_mudroom boolean default false;
alter table public.properties add column if not exists has_pet_door boolean default false;
alter table public.properties add column if not exists has_pet_wash_station boolean default false;
alter table public.properties add column if not exists has_screened_porch boolean default false;
alter table public.properties add column if not exists has_pool boolean default false;
alter table public.properties add column if not exists has_built_in_pet_features boolean default false;
alter table public.properties add column if not exists built_in_pet_features_desc text;

-- Properties: HOA & pet policies
alter table public.properties add column if not exists hoa_has_restrictions boolean default false;
alter table public.properties add column if not exists hoa_pet_policy text;
alter table public.properties add column if not exists hoa_breed_restrictions text;
alter table public.properties add column if not exists hoa_pet_limit integer;

-- Analyses: AI insight storage
alter table public.analyses add column if not exists species_insights_json jsonb default '{}'::jsonb;
alter table public.analyses add column if not exists marketing_tips_json jsonb default '[]'::jsonb;
alter table public.analyses add column if not exists upgrade_suggestions_json jsonb default '[]'::jsonb;
