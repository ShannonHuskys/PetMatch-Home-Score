import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createProperty, createPetProfile, createAnalysis } from '@/lib/database';
import { propertySchema, petProfileSchema } from '@/lib/validations';
import { buildMapContext } from '@/services/maps';
import { analyzeProperty } from '@/services/ai';
import type { Property, PetProfile } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const propertyRaw = JSON.parse(formData.get('property') as string);
    const petsRaw = JSON.parse(formData.get('pets') as string);

    const propertyData = propertySchema.parse(propertyRaw);
    const petsData = petsRaw.map((p: Record<string, unknown>) => petProfileSchema.parse(p));

    // Upload listing photos
    const photoFiles: File[] = [];
    formData.getAll('photos').forEach((file) => {
      if (file instanceof File) photoFiles.push(file);
    });

    // Create property
    const fullAddress = [propertyData.address, propertyData.city, propertyData.state, propertyData.postal_code]
      .filter(Boolean)
      .join(', ');

    const mapContext = await buildMapContext(fullAddress);

    const property = await createProperty(supabase, {
      ...propertyData,
      user_id: user.id,
      latitude: mapContext.latitude,
      longitude: mapContext.longitude,
    } as Partial<Property>);

    // Create pet profiles
    const pets: PetProfile[] = [];
    for (let i = 0; i < petsData.length; i++) {
      const petData = petsData[i];

      // Upload pet photo if provided
      let photoUrl: string | null = null;
      const petPhotoFile = formData.get(`pet_photo_${i}`) as File | null;
      if (petPhotoFile && petPhotoFile instanceof File) {
        const ext = petPhotoFile.name.split('.').pop();
        const path = `${user.id}/${property.id}/pets/${i}.${ext}`;
        const { data: uploadData } = await supabase.storage
          .from('analysis-photos')
          .upload(path, petPhotoFile, { upsert: true });
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('analysis-photos')
            .getPublicUrl(uploadData.path);
          photoUrl = urlData.publicUrl;
        }
      }

      const pet = await createPetProfile(supabase, {
        ...petData,
        property_id: property.id,
        user_id: user.id,
        photo_url: photoUrl,
      } as Partial<PetProfile>);
      pets.push(pet);
    }

    // Upload listing photos
    for (const photo of photoFiles) {
      const ext = photo.name.split('.').pop();
      const path = `${user.id}/${property.id}/listing/${Date.now()}.${ext}`;
      const { data: uploadData } = await supabase.storage
        .from('analysis-photos')
        .upload(path, photo);
      if (uploadData) {
        await supabase.from('analysis_photos').insert({
          property_id: property.id,
          user_id: user.id,
          storage_path: uploadData.path,
        });
      }
    }

    // Run analysis
    const result = await analyzeProperty(property, pets, mapContext);

    const analysis = await createAnalysis(supabase, {
      property_id: property.id,
      user_id: user.id,
      overall_score: result.overall_score,
      traffic_safety_score: result.traffic_safety_score,
      yard_score: result.yard_score,
      senior_comfort_score: result.senior_comfort_score,
      exercise_score: result.exercise_score,
      indoor_comfort_score: result.indoor_comfort_score,
      noise_stress_score: result.noise_stress_score,
      red_flags_json: result.red_flags as unknown as string[],
      highlights_json: result.highlights as unknown as string[],
      ai_summary: result.ai_summary,
      agent_notes: result.agent_notes,
      scoring_details_json: result.scoring_details,
      map_context_json: mapContext,
      species_insights_json: result.species_insights || {},
      marketing_tips_json: result.marketing_tips || [],
      upgrade_suggestions_json: result.upgrade_suggestions || [],
    });

    return NextResponse.json({ analysis_id: analysis.id });
  } catch (error) {
    console.error('Analysis creation failed:', error);
    const message = error instanceof Error ? error.message : 'Failed to create analysis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
