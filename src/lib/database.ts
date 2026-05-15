import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Property,
  PetProfile,
  Analysis,
  AnalysisPhoto,
  UserSettings,
  PropertyWithRelations,
  SavedPet,
} from '@/types/database';

export async function getPropertiesForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<PropertyWithRelations[]> {
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!properties?.length) return [];

  const propertyIds = properties.map((p: Property) => p.id);

  const [petsRes, analysesRes, photosRes] = await Promise.all([
    supabase.from('pet_profiles').select('*').in('property_id', propertyIds),
    supabase
      .from('analyses')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false }),
    supabase.from('analysis_photos').select('*').in('property_id', propertyIds),
  ]);

  return properties.map((property: Property) => ({
    ...property,
    pet_profiles: (petsRes.data || []).filter(
      (p: PetProfile) => p.property_id === property.id
    ),
    analyses: (analysesRes.data || []).filter(
      (a: Analysis) => a.property_id === property.id
    ),
    analysis_photos: (photosRes.data || []).filter(
      (p: AnalysisPhoto) => p.property_id === property.id
    ),
  }));
}

export async function getPropertyWithRelations(
  supabase: SupabaseClient,
  propertyId: string,
  userId: string
): Promise<PropertyWithRelations | null> {
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .eq('user_id', userId)
    .single();

  if (error || !property) return null;

  const [petsRes, analysesRes, photosRes] = await Promise.all([
    supabase.from('pet_profiles').select('*').eq('property_id', propertyId),
    supabase
      .from('analyses')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false }),
    supabase
      .from('analysis_photos')
      .select('*')
      .eq('property_id', propertyId),
  ]);

  return {
    ...property,
    pet_profiles: petsRes.data || [],
    analyses: analysesRes.data || [],
    analysis_photos: photosRes.data || [],
  };
}

export async function createProperty(
  supabase: SupabaseClient,
  data: Partial<Property>
): Promise<Property> {
  const { data: property, error } = await supabase
    .from('properties')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return property;
}

export async function createPetProfile(
  supabase: SupabaseClient,
  data: Partial<PetProfile>
): Promise<PetProfile> {
  const { data: pet, error } = await supabase
    .from('pet_profiles')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return pet;
}

export async function createAnalysis(
  supabase: SupabaseClient,
  data: Partial<Analysis>
): Promise<Analysis> {
  const { data: analysis, error } = await supabase
    .from('analyses')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return analysis;
}

export async function updateAnalysis(
  supabase: SupabaseClient,
  id: string,
  data: Partial<Analysis>
): Promise<Analysis> {
  const { data: analysis, error } = await supabase
    .from('analyses')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return analysis;
}

export async function deleteProperty(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}

export async function getUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertUserSettings(
  supabase: SupabaseClient,
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSavedPetsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedPet[]> {
  const { data, error } = await supabase
    .from('saved_pets')
    .select('*')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createSavedPet(
  supabase: SupabaseClient,
  data: Partial<SavedPet>
): Promise<SavedPet> {
  const { data: pet, error } = await supabase
    .from('saved_pets')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return pet;
}

export async function updateSavedPet(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<SavedPet>
): Promise<SavedPet> {
  const { data, error } = await supabase
    .from('saved_pets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSavedPet(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('saved_pets').delete().eq('id', id);
  if (error) throw error;
}

export async function touchSavedPet(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  await supabase
    .from('saved_pets')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id);
}
