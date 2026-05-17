-- Migration 003: Public shareable reports
-- Adds share_token + sharing controls to analyses, plus a security-definer RPC
-- so anonymous users can fetch a shared report via the unguessable token only.

alter table public.analyses
  add column if not exists share_token text unique,
  add column if not exists share_enabled boolean default false,
  add column if not exists share_views integer default 0,
  add column if not exists last_viewed_at timestamptz;

create index if not exists idx_analyses_share_token on public.analyses(share_token)
  where share_token is not null;

-- Security-definer function: returns shared-report payload for a valid token.
-- Anon role can execute, but only with a token that maps to share_enabled=true.
-- IMPORTANT: explicitly strips private agent fields (agent_notes, marketing_tips_json,
-- internal notes, user_id) so they never leave the database for shared analyses.
create or replace function public.get_shared_analysis(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  if p_token is null or length(p_token) < 8 then
    return null;
  end if;

  -- Bump view counter (best-effort)
  update public.analyses
    set share_views = coalesce(share_views, 0) + 1,
        last_viewed_at = now()
    where share_token = p_token and share_enabled = true;

  select json_build_object(
    'analysis', json_build_object(
      'id', a.id,
      'property_id', a.property_id,
      'overall_score', a.overall_score,
      'traffic_safety_score', a.traffic_safety_score,
      'yard_score', a.yard_score,
      'senior_comfort_score', a.senior_comfort_score,
      'exercise_score', a.exercise_score,
      'indoor_comfort_score', a.indoor_comfort_score,
      'noise_stress_score', a.noise_stress_score,
      'red_flags_json', a.red_flags_json,
      'highlights_json', a.highlights_json,
      'ai_summary', a.ai_summary,
      'scoring_details_json', a.scoring_details_json,
      'species_insights_json', a.species_insights_json,
      'upgrade_suggestions_json', a.upgrade_suggestions_json,
      'map_context_json', a.map_context_json,
      'agent_notes', '',
      'marketing_tips_json', null,
      'created_at', a.created_at,
      'updated_at', a.updated_at
    ),
    'property', json_build_object(
      'id', p.id,
      'address', p.address,
      'city', p.city,
      'state', p.state,
      'postal_code', p.postal_code,
      'latitude', p.latitude,
      'longitude', p.longitude,
      'listing_description', p.listing_description,
      'beds', p.beds,
      'baths', p.baths,
      'sqft', p.sqft,
      'lot_size', p.lot_size,
      'property_type', p.property_type,
      'stories', p.stories,
      'flooring_type', p.flooring_type,
      'fencing_type', p.fencing_type,
      'has_mudroom', p.has_mudroom,
      'has_pet_door', p.has_pet_door,
      'has_pet_wash_station', p.has_pet_wash_station,
      'has_screened_porch', p.has_screened_porch,
      'has_pool', p.has_pool,
      'has_built_in_pet_features', p.has_built_in_pet_features,
      'built_in_pet_features_desc', p.built_in_pet_features_desc,
      'hoa_has_restrictions', p.hoa_has_restrictions,
      'hoa_pet_policy', p.hoa_pet_policy,
      'hoa_breed_restrictions', p.hoa_breed_restrictions,
      'hoa_pet_limit', p.hoa_pet_limit,
      'notes', '',
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ),
    'pets', coalesce(
      (select json_agg(json_build_object(
        'id', pet.id,
        'property_id', pet.property_id,
        'name', pet.name,
        'species', pet.species,
        'breed', pet.breed,
        'age_category', pet.age_category,
        'size_category', pet.size_category,
        'activity_level', pet.activity_level,
        'indoor_outdoor', pet.indoor_outdoor,
        'mobility_limitations', pet.mobility_limitations,
        'anxiety_sensitivity', pet.anxiety_sensitivity,
        'escape_risk', pet.escape_risk,
        'special_notes', '',
        'photo_url', pet.photo_url,
        'created_at', pet.created_at,
        'updated_at', pet.updated_at
      )) from public.pet_profiles pet where pet.property_id = p.id),
      '[]'::json
    ),
    'branding_name', coalesce(
      (select default_branding_name from public.user_settings where user_id = a.user_id),
      'PetMatch Home Score'
    )
  )
  into result
  from public.analyses a
  join public.properties p on p.id = a.property_id
  where a.share_token = p_token and a.share_enabled = true
  limit 1;

  return result;
end;
$$;

grant execute on function public.get_shared_analysis(text) to anon, authenticated;
