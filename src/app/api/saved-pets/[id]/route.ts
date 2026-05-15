import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { deleteSavedPet, updateSavedPet, touchSavedPet } from '@/lib/database';

const updateSchema = z.object({
  client_name: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).optional(),
  breed: z.string().optional().nullable(),
  age_category: z.enum(['puppy_kitten', 'young', 'adult', 'senior']).optional(),
  size_category: z.enum(['tiny', 'small', 'medium', 'large', 'giant']).optional(),
  activity_level: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']).optional(),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'both']).optional(),
  mobility_limitations: z.string().optional().nullable(),
  anxiety_sensitivity: z.enum(['low', 'moderate', 'high']).optional(),
  escape_risk: z.enum(['low', 'moderate', 'high']).optional(),
  special_notes: z.string().optional().nullable(),
  touch: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { touch, ...updates } = parsed.data;

    if (touch) {
      await touchSavedPet(supabase, id);
      return NextResponse.json({ success: true });
    }

    const pet = await updateSavedPet(supabase, id, updates);
    return NextResponse.json({ pet });
  } catch (error) {
    console.error('PATCH saved-pets failed:', error);
    return NextResponse.json({ error: 'Failed to update saved pet.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteSavedPet(supabase, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE saved-pets failed:', error);
    return NextResponse.json({ error: 'Failed to delete saved pet.' }, { status: 500 });
  }
}
