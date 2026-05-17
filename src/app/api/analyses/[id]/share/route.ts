import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function generateToken(): string {
  // 12 bytes -> 16 char base64url string, ~96 bits of entropy
  return randomBytes(12).toString('base64url');
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('analyses')
      .select('share_token, share_enabled, share_views, last_viewed_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GET share status failed:', error);
    return NextResponse.json({ error: 'Failed to load share status.' }, { status: 500 });
  }
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Read existing row to keep an existing token if present
    const { data: existing } = await supabase
      .from('analyses')
      .select('share_token')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const token = existing.share_token || generateToken();

    const { data, error } = await supabase
      .from('analyses')
      .update({ share_token: token, share_enabled: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('share_token, share_enabled, share_views, last_viewed_at')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to enable sharing' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('POST enable share failed:', error);
    return NextResponse.json({ error: 'Failed to enable sharing.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('analyses')
      .update({ share_enabled: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to disable sharing' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE share failed:', error);
    return NextResponse.json({ error: 'Failed to disable sharing.' }, { status: 500 });
  }
}
