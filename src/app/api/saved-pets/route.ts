import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  createSavedPet,
  getSavedPetsForUser,
} from '@/lib/database';

const savedPetInputSchema = z.object({
  client_name: z.string().optional().nullable(),
  name: z.string().min(1, 'Pet name is required'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).default('dog'),
  breed: z.string().optional().nullable(),
  age_category: z.enum(['puppy_kitten', 'young', 'adult', 'senior']).default('adult'),
  size_category: z.enum(['tiny', 'small', 'medium', 'large', 'giant']).default('medium'),
  activity_level: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']).default('moderate'),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'both']).default('both'),
  mobility_limitations: z.string().optional().nullable(),
  anxiety_sensitivity: z.enum(['low', 'moderate', 'high']).default('low'),
  escape_risk: z.enum(['low', 'moderate', 'high']).default('low'),
  special_notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pets = await getSavedPetsForUser(supabase, user.id);
    return NextResponse.json({ pets });
  } catch (error) {
    console.error('GET saved-pets failed:', error);
    return NextResponse.json({ error: 'Failed to load saved pets.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = savedPetInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pet = await createSavedPet(supabase, {
      ...parsed.data,
      user_id: user.id,
    });

    return NextResponse.json({ pet });
  } catch (error) {
    console.error('POST saved-pets failed:', error);
    return NextResponse.json({ error: 'Failed to save pet.' }, { status: 500 });
  }
}
