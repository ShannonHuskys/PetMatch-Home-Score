import { NextResponse } from 'next/server';
import { extractListing } from '@/services/listing-extractor';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text : '';

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please paste at least 20 characters of listing text.' },
        { status: 400 }
      );
    }

    const extracted = await extractListing(text);
    return NextResponse.json({ extracted });
  } catch (error) {
    console.error('extract-listing error:', error);
    return NextResponse.json(
      { error: 'Failed to extract listing data. Please try again.' },
      { status: 500 }
    );
  }
}
