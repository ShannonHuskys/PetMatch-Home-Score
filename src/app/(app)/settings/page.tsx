'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co';

export default function SettingsPage() {
  const [brandingName, setBrandingName] = useState('PetMatch Home Score');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) return;
    async function load() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBrandingName(data.default_branding_name || 'PetMatch Home Score');
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (isDemoMode) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    setSaving(true);
    setSaved(false);

    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, default_branding_name: brandingName },
        { onConflict: 'user_id' }
      );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Settings" />
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-10 rounded bg-gray-200" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Settings" description="Configure your PetMatch Home Score preferences" />

      {isDemoMode && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Demo Mode — Connect Supabase to save settings. See <code className="font-mono">.env.example</code> for setup.
        </div>
      )}

      <Card>
        <CardTitle className="mb-4">Report Branding</CardTitle>
        <p className="mb-4 text-sm text-gray-500">
          This name appears on printed reports shared with clients.
        </p>
        <Input
          label="Branding Name"
          value={brandingName}
          onChange={(e) => setBrandingName(e.target.value)}
          placeholder="Your Company Name"
        />
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} loading={saving}>
            Save Settings
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Settings saved!</span>
          )}
        </div>
      </Card>
    </div>
  );
}
