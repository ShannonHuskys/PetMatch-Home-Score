import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSceneImage } from '@/services/pet-visualizer';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysis_id, pet_id, scene_id } = await request.json();

    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysis_id)
      .eq('user_id', user.id)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const { data: property } = await supabase
      .from('properties')
      .select('*')
      .eq('id', analysis.property_id)
      .single();

    const { data: pet } = await supabase
      .from('pet_profiles')
      .select('*')
      .eq('id', pet_id)
      .single();

    if (!property || !pet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const imageUrl = await generateSceneImage(property, pet, scene_id);

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image generation unavailable. Configure OPENAI_API_KEY to enable this feature.' },
        { status: 503 }
      );
    }

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Visualization failed:', error);
    return NextResponse.json({ error: 'Failed to generate visualization' }, { status: 500 });
  }
}
