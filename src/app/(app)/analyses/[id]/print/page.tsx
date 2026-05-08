import { PrintReportClient } from './print-report-client';
import { notFound } from 'next/navigation';
import { isDemoMode } from '@/lib/demo-mode';
import { MOCK_PROPERTIES } from '@/lib/mock-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PrintPage({ params }: PageProps) {
  const { id } = await params;

  if (isDemoMode) {
    const mockProp = MOCK_PROPERTIES.find((p) =>
      p.analyses.some((a) => a.id === id)
    );
    if (!mockProp) notFound();
    const mockAnalysis = mockProp.analyses.find((a) => a.id === id)!;
    return (
      <PrintReportClient
        analysis={mockAnalysis}
        property={mockProp}
        pets={mockProp.pet_profiles}
        brandingName="PetMatch Home Score"
      />
    );
  }

  const { createClient } = await import('@/lib/supabase/server');
  const { getUserSettings } = await import('@/lib/database');
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

  const [propertyRes, petsRes, settings] = await Promise.all([
    supabase.from('properties').select('*').eq('id', analysis.property_id).single(),
    supabase.from('pet_profiles').select('*').eq('property_id', analysis.property_id),
    getUserSettings(supabase, user.id),
  ]);

  if (!propertyRes.data) notFound();

  return (
    <PrintReportClient
      analysis={analysis}
      property={propertyRes.data}
      pets={petsRes.data || []}
      brandingName={settings?.default_branding_name || 'PetMatch Home Score'}
    />
  );
}
