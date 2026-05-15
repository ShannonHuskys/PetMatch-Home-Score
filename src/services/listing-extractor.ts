import OpenAI from 'openai';
import type { FlooringType, FencingType } from '@/types/database';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface ExtractedListing {
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  property_type?: 'single_family' | 'condo' | 'townhouse' | 'apartment' | 'multi_family' | 'other';
  beds?: number;
  baths?: number;
  sqft?: number;
  lot_size?: string;
  stories?: number;
  flooring_type?: FlooringType;
  fencing_type?: FencingType;
  has_mudroom?: boolean;
  has_pet_door?: boolean;
  has_pet_wash_station?: boolean;
  has_screened_porch?: boolean;
  has_pool?: boolean;
  has_built_in_pet_features?: boolean;
  built_in_pet_features_desc?: string;
  hoa_has_restrictions?: boolean;
  hoa_pet_policy?: string;
  hoa_breed_restrictions?: string;
  hoa_pet_limit?: number;
  listing_description?: string;
  extraction_confidence: 'high' | 'medium' | 'low';
  notes_for_agent?: string;
}

const EMPTY_EXTRACTION: ExtractedListing = {
  extraction_confidence: 'low',
  notes_for_agent: 'No listing text was provided to extract from.',
};

export function buildExtractorSystemPrompt(): string {
  return `You are a real estate listing parser specialized in extracting property data for pet-suitability analysis.

Given a listing description (from MLS, Zillow, Redfin, or agent notes), extract structured property data. Pay special attention to pet-relevant features.

EXTRACTION RULES:
- Only return values you are confident about. Omit fields you cannot determine.
- For booleans, return true only if explicitly stated or strongly implied. Return false only if explicitly absent. Otherwise omit.
- For flooring_type: hardwood, lvp (luxury vinyl plank), tile, laminate, carpet, mixed (multiple types mentioned), other.
- For fencing_type: none, partial, full (any fenced yard), privacy (6ft+ wood/vinyl), chain_link, electric, other.
- For property_type: single_family (house), condo, townhouse, apartment, multi_family (duplex/triplex), other.
- Infer stories from descriptors like "ranch" (1), "two-story" (2), "split level" (often 2). Condos/apartments default to 1.
- Pet features to detect:
  * has_mudroom: any "mudroom", "drop zone", "utility entry"
  * has_pet_door: "doggy door", "pet door"
  * has_pet_wash_station: "pet wash", "dog wash", "pet shower", "grooming station"
  * has_screened_porch: "screened porch", "catio", "screened lanai", "screened-in patio"
  * has_pool: "pool", "swimming pool" (any mention)
  * has_built_in_pet_features: built-in kennels, dog runs, cat shelving, pet nooks — if found, populate built_in_pet_features_desc
- HOA detection: only set hoa_has_restrictions=true if explicit pet restrictions are mentioned. If condo/townhouse with no mention, omit (let agent fill).
- listing_description: the cleaned, readable version of the input text (max ~500 chars). Trim MLS metadata, fix line breaks.
- extraction_confidence: "high" if address + beds/baths/sqft + flooring or fencing clearly found; "medium" if some fields found; "low" if very little extractable.
- notes_for_agent: 1 sentence noting anything ambiguous the agent should verify (e.g. "Fencing type not specified — verify on showing").

Return ONLY valid JSON. No markdown, no code fences, no commentary.`;
}

export async function extractListing(rawText: string): Promise<ExtractedListing> {
  if (!rawText || rawText.trim().length < 20) {
    return EMPTY_EXTRACTION;
  }

  if (!OPENAI_API_KEY) {
    return heuristicExtract(rawText);
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildExtractorSystemPrompt() },
        {
          role: 'user',
          content: `Listing text to parse:\n\n${rawText.slice(0, 8000)}\n\nReturn the extracted JSON now.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return heuristicExtract(rawText);

    const parsed = JSON.parse(content) as Partial<ExtractedListing>;

    if (!parsed.extraction_confidence) {
      parsed.extraction_confidence = 'medium';
    }

    return parsed as ExtractedListing;
  } catch (error) {
    console.error('OpenAI listing extraction failed, falling back to heuristic:', error);
    return heuristicExtract(rawText);
  }
}

function heuristicExtract(text: string): ExtractedListing {
  const lower = text.toLowerCase();
  const result: ExtractedListing = {
    extraction_confidence: 'low',
    notes_for_agent: 'AI extraction unavailable — only basic features detected. Please verify all fields.',
    listing_description: text.slice(0, 500),
  };

  const bedsMatch = text.match(/(\d+)[\s-]*(?:bedrooms?|beds?|bd|br)/i);
  if (bedsMatch) result.beds = parseInt(bedsMatch[1], 10);

  const bathsMatch = text.match(/(\d+(?:\.\d+)?)[\s-]*(?:bathrooms?|baths?|ba)/i);
  if (bathsMatch) result.baths = parseFloat(bathsMatch[1]);

  const sqftMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square feet|sf)\b/i);
  if (sqftMatch) result.sqft = parseInt(sqftMatch[1].replace(/,/g, ''), 10);

  const lotMatch = text.match(/(\d+\.?\d*)\s*(?:acres?|ac)\b/i);
  if (lotMatch) result.lot_size = `${lotMatch[1]} acres`;

  const cityStateMatch = text.match(/in\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?),\s*([A-Z]{2})\b/);
  if (cityStateMatch) {
    result.city = cityStateMatch[1];
    result.state = cityStateMatch[2];
  }

  if (/no\s+hoa|hoa[- ]free/i.test(text)) {
    result.hoa_has_restrictions = false;
  }

  if (/condo/i.test(text)) result.property_type = 'condo';
  else if (/townhouse|townhome/i.test(text)) result.property_type = 'townhouse';
  else if (/apartment/i.test(text)) result.property_type = 'apartment';
  else if (/single[- ]family|ranch|colonial|cape cod/i.test(text)) result.property_type = 'single_family';

  if (/ranch|single[- ]story|one[- ]story/i.test(text)) result.stories = 1;
  else if (/two[- ]story|2[- ]story/i.test(text)) result.stories = 2;

  if (/hardwood/i.test(text)) result.flooring_type = 'hardwood';
  else if (/lvp|luxury vinyl/i.test(text)) result.flooring_type = 'lvp';
  else if (/\btile\b/i.test(text) && !/backsplash/i.test(lower.split('tile')[0]?.slice(-15) || '')) result.flooring_type = 'tile';
  else if (/carpet/i.test(text)) result.flooring_type = 'carpet';

  if (/fenced/i.test(text)) {
    if (/privacy fenc/i.test(text)) result.fencing_type = 'privacy';
    else if (/chain[- ]link/i.test(text)) result.fencing_type = 'chain_link';
    else result.fencing_type = 'full';
  }

  result.has_mudroom = /mudroom|drop zone/i.test(text);
  result.has_pet_door = /doggy door|pet door/i.test(text);
  result.has_pet_wash_station = /pet wash|dog wash|grooming station/i.test(text);
  result.has_screened_porch = /screened porch|catio|screened lanai/i.test(text);
  result.has_pool = /\bpool\b/i.test(text) && !/pool table/i.test(text);

  return result;
}
