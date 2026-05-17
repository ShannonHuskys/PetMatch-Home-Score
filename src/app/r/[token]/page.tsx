import { notFound } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';
import { MOCK_PROPERTIES } from '@/lib/mock-data';
import { SharedReportClient } from './shared-report-client';
import type { Analysis, Property, PetProfile } from '@/types/database';

interface PageProps {
  params: Promise<{ token: string }>;
}

interface SharedPayload {
  analysis: Analysis;
  property: Property;
  pets: PetProfile[];
  branding_name: string;
}

async function loadSharedAnalysis(token: string): Promise<SharedPayload | null> {
  if (isDemoMode || token.startsWith('demo-')) {
    const prop = MOCK_PROPERTIES.find((p) =>
      p.analyses.some((a) => a.share_token === token && a.share_enabled)
    );
    if (!prop) return null;
    const analysis = prop.analyses.find((a) => a.share_token === token)!;
    // Strip relation arrays (analyses, pet_profiles) from the property — those
    // would otherwise drag agent_notes and other private fields into the RSC payload.
    const { analyses: _a, pet_profiles: _p, analysis_photos: _ap, ...bareProperty } = prop;
    return {
      analysis,
      property: bareProperty as Property,
      pets: prop.pet_profiles,
      branding_name: 'PetMatch Home Score',
    };
  }

  const { createBrowserClient } = await import('@supabase/ssr');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.rpc('get_shared_analysis', { p_token: token });

  if (error) {
    console.error('get_shared_analysis RPC failed:', error);
    return null;
  }

  if (!data) return null;
  return data as SharedPayload;
}

export default async function SharedReportPage({ params }: PageProps) {
  const { token } = await params;
  const payload = await loadSharedAnalysis(token);
  if (!payload) notFound();

  // Strip private agent-only fields so they never reach the client HTML payload.
  // Fresh object literal containing only buyer-safe fields — agent_notes and
  // marketing_tips_json are intentionally redacted before the prop is serialized.
  const buyerSafeAnalysis: Analysis = {
    id: payload.analysis.id,
    property_id: payload.analysis.property_id,
    user_id: '',
    overall_score: payload.analysis.overall_score,
    traffic_safety_score: payload.analysis.traffic_safety_score,
    yard_score: payload.analysis.yard_score,
    senior_comfort_score: payload.analysis.senior_comfort_score,
    exercise_score: payload.analysis.exercise_score,
    indoor_comfort_score: payload.analysis.indoor_comfort_score,
    noise_stress_score: payload.analysis.noise_stress_score,
    red_flags_json: payload.analysis.red_flags_json,
    highlights_json: payload.analysis.highlights_json,
    ai_summary: payload.analysis.ai_summary,
    agent_notes: '', // intentionally stripped — private agent strategy
    scoring_details_json: payload.analysis.scoring_details_json,
    species_insights_json: payload.analysis.species_insights_json,
    marketing_tips_json: null, // intentionally stripped — agent-only
    upgrade_suggestions_json: payload.analysis.upgrade_suggestions_json,
    map_context_json: payload.analysis.map_context_json,
    share_token: null,
    share_enabled: false,
    share_views: 0,
    last_viewed_at: null,
    created_at: payload.analysis.created_at,
    updated_at: payload.analysis.updated_at,
  };

  return (
    <SharedReportClient
      analysis={buyerSafeAnalysis}
      property={payload.property}
      pets={payload.pets}
      brandingName={payload.branding_name || 'PetMatch Home Score'}
    />
  );
}

export const metadata = {
  title: 'Pet Suitability Report',
  description: 'A pet-friendly home report shared by your real estate agent.',
};
