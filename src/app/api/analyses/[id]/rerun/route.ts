import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateAnalysis } from '@/lib/database';
import { buildMapContext } from '@/services/maps';
import { analyzeProperty } from '@/services/ai';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: analysis } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
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

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { data: pets } = await supabase
      .from('pet_profiles')
      .select('*')
      .eq('property_id', property.id);

    const fullAddress = [property.address, property.city, property.state, property.postal_code]
      .filter(Boolean)
      .join(', ');

    const mapContext = await buildMapContext(fullAddress);
    const result = await analyzeProperty(property, pets || [], mapContext);

    await updateAnalysis(supabase, id, {
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
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rerun failed:', error);
    return NextResponse.json({ error: 'Failed to rerun analysis' }, { status: 500 });
  }
}
