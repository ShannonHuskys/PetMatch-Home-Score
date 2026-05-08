import { DashboardClient } from './dashboard-client';
import { isDemoMode } from '@/lib/demo-mode';
import { MOCK_PROPERTIES } from '@/lib/mock-data';

export default async function DashboardPage() {
  if (isDemoMode) {
    return <DashboardClient properties={MOCK_PROPERTIES} />;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const { getPropertiesForUser } = await import('@/lib/database');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let properties: Awaited<ReturnType<typeof getPropertiesForUser>> = [];
  if (user) {
    try {
      properties = await getPropertiesForUser(supabase, user.id);
    } catch {
      // Will show empty state
    }
  }

  return <DashboardClient properties={properties} />;
}
