import { AnalysisDetailClient } from './analysis-detail-client';
import { notFound } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';
import { MOCK_PROPERTIES } from '@/lib/mock-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (isDemoMode) {
    const mockProp = MOCK_PROPERTIES.find((p) =>
      p.analyses.some((a) => a.id === id)
    );
    if (!mockProp) notFound();
    const mockAnalysis = mockProp.analyses.find((a) => a.id === id)!;
    return (
      <AnalysisDetailClient
        analysis={mockAnalysis}
        property={mockProp}
        pets={mockProp.pet_profiles}
        photos={[]}
      />
    );
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!analysis) notFound();

  const [propertyRes, petsRes, photosRes] = await Promise.all([
    supabase.from('properties').select('*').eq('id', analysis.property_id).single(),
    supabase.from('pet_profiles').select('*').eq('property_id', analysis.property_id),
    supabase.from('analysis_photos').select('*').eq('property_id', analysis.property_id),
  ]);

  if (!propertyRes.data) notFound();

  return (
    <AnalysisDetailClient
      analysis={analysis}
      property={propertyRes.data}
      pets={petsRes.data || []}
      photos={photosRes.data || []}
    />
  );
}
