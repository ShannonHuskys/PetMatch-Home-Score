import OpenAI from 'openai';
import type { Property, PetProfile, MapContext, AnalysisResult } from '@/types/database';
import { generateFallbackAnalysis } from './scoring-fallback';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function buildSystemPrompt(): string {
  return `You are PetMatch Home Score, an expert AI system that evaluates residential properties for pet suitability. You combine deep real estate expertise, animal behavior knowledge, and neighborhood safety data.

DOMAIN KNOWLEDGE — USE THIS IN EVERY ANALYSIS:

DOG OWNERS (typically more demanding in home search):
- Fenced yard is often non-negotiable — the #1 feature. Privacy fence (6ft+) is gold standard. Chain link is acceptable. No fence is usually a dealbreaker.
- Neighborhood walkability matters hugely — sidewalks, low traffic, safe streets.
- Nearby parks/trails, especially off-leash areas, are highly valued.
- Home layout: easy outdoor access, mudroom, space near entry, single-story for older dogs.
- Durable materials: scratch-resistant floors (LVP, tile > hardwood > carpet), wipeable walls.
- Noise: distance from neighbors matters (barking concerns go both ways).
- Space: medium/large dogs need bigger homes/yards.
- Dog owners will compromise on finishes but NOT on yard + location.

CAT OWNERS (more flexible overall, very specific on interiors):
- Natural light & windows are essential — cats need perches and sunbeams.
- Quiet environment — less street noise, calmer settings.
- Space for litter boxes — discreet, ventilated areas (laundry rooms, closets).
- Vertical space potential — shelves, lofts, bonus rooms, vaulted ceilings.
- Safe outdoor options — screened porches ("catios") are a huge plus.
- Less concern about yard size. Rarely reject over outdoor space — but may over layout quirks.

FLOORING (critical for both):
- LVP/tile/laminate: Best for pets (waterproof, scratch-resistant, easy clean).
- Hardwood: Looks great but scratches from claws, water damage from accidents.
- Carpet: Worst for pets — traps fur, stains, odors. Major negative.

PET-FRIENDLY UPGRADES THAT ADD VALUE:
- HIGH IMPACT: Fully fenced backyard, LVP/tile flooring, pet washing station, screened porch, reinforced fencing.
- MEDIUM IMPACT: Built-in feeding stations, mudroom, pet doors (especially smart ones), designated pet zones, turf landscaping.
- EMOTIONAL WOW: Custom dog runs, catios, cat climbing walls, built-in kennels, pet-friendly backyard design with shade/paths/water features.

HOA/COMMUNITY POLICIES:
- Breed restrictions, pet limits, and pet deposits are top dealbreakers.
- Calling out "no HOA pet restrictions" upfront builds trust fast.
- Undisclosed restrictions cause late-stage deal collapse.

KEY INSIGHT: Pet owners are emotionally driven buyers. They move faster when a home fits their pet's needs — but walk away quickly when it doesn't.

SCORING GUIDELINES (each 0–100):
- traffic_safety: Penalize highways, major roads, dangerous intersections. Reward cul-de-sacs, quiet streets, gated communities, sidewalks. Fencing adds safety buffer.
- yard: Fenced yard is #1. Reward privacy fencing, lot size, shade, grass, dog runs. Penalize no yard, unfenced, shared spaces. Weight very heavily for dogs. Less critical for cats.
- senior_comfort: For older/mobility-limited pets: reward single-story, smooth floors, elevator access, warm spaces, minimal stairs. For young pets, score neutral.
- exercise: Reward nearby parks, trails, off-leash areas, walkable streets, large yards. Penalize isolated locations for active breeds.
- indoor_comfort: Reward LVP/tile flooring, natural light, open layouts, sunrooms, mudrooms, pet wash stations, pet doors, bonus rooms. Penalize carpet. For cats: window access and vertical space are critical.
- noise_stress: Penalize highway noise, urban bustle, shared walls. Reward quiet streets, detached homes, cul-de-sacs. Weight heavily for anxious pets and cats.

OUTPUT REQUIREMENTS:
- ai_summary: Buyer-friendly — warm, clear, helpful. Mention specific pet names and species.
- agent_notes: Strategic — what to emphasize in showings, what to address proactively, marketing angles.
- species_insights: Per-species breakdown (dog and/or cat) with strengths, concerns, must-haves met/missing, dealbreaker risk level.
- marketing_tips: Specific listing language, photo tips, and positioning strategies for marketing to pet owners.
- upgrade_suggestions: Practical improvements with impact level (high/medium/low), description, and estimated cost.

Be transparent about why scores are what they are. Never be a black box.`;
}

function buildUserPrompt(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext
): string {
  const petDescriptions = pets
    .map(
      (p, i) =>
        `Pet ${i + 1}: ${p.name} — ${p.species} (${p.breed || 'unknown breed'}), ${p.age_category}, ${p.size_category} size, ${p.activity_level} activity, ${p.indoor_outdoor} preference, anxiety: ${p.anxiety_sensitivity}, escape risk: ${p.escape_risk}${p.mobility_limitations ? `, mobility issues: ${p.mobility_limitations}` : ''}${p.special_notes ? `, notes: ${p.special_notes}` : ''}`
    )
    .join('\n');

  const features: string[] = [];
  if (property.flooring_type) features.push(`Flooring: ${property.flooring_type}`);
  if (property.fencing_type) features.push(`Fencing: ${property.fencing_type}`);
  if (property.stories) features.push(`Stories: ${property.stories}`);
  if (property.has_mudroom) features.push('Has mudroom');
  if (property.has_pet_door) features.push('Has pet door');
  if (property.has_pet_wash_station) features.push('Has pet wash station');
  if (property.has_screened_porch) features.push('Has screened porch/catio');
  if (property.has_pool) features.push('Has pool');
  if (property.has_built_in_pet_features) features.push(`Built-in pet features: ${property.built_in_pet_features_desc || 'yes'}`);

  const hoaParts: string[] = [];
  if (property.hoa_has_restrictions) {
    hoaParts.push('Has HOA restrictions');
    if (property.hoa_pet_policy) hoaParts.push(`Policy: ${property.hoa_pet_policy}`);
    if (property.hoa_breed_restrictions) hoaParts.push(`Breed restrictions: ${property.hoa_breed_restrictions}`);
    if (property.hoa_pet_limit) hoaParts.push(`Pet limit: ${property.hoa_pet_limit}`);
  } else {
    hoaParts.push('No HOA pet restrictions noted');
  }

  return `PROPERTY:
Address: ${property.address}${property.city ? `, ${property.city}` : ''}${property.state ? `, ${property.state}` : ''}
Type: ${property.property_type}
Beds: ${property.beds || 'unknown'} | Baths: ${property.baths || 'unknown'} | Sqft: ${property.sqft || 'unknown'} | Lot: ${property.lot_size || 'unknown'}
${features.length > 0 ? `Pet-relevant features: ${features.join(' | ')}` : ''}
HOA: ${hoaParts.join(' | ')}
Listing description: ${property.listing_description || 'Not provided'}
Agent notes: ${property.notes || 'None'}

PET PROFILE(S):
${petDescriptions}

MAP/NEIGHBORHOOD CONTEXT:
${mapContext.summary}

Return ONLY a JSON object with this exact structure (no markdown, no code fences):
{
  "overall_score": <number 0-100>,
  "traffic_safety_score": <number>,
  "yard_score": <number>,
  "senior_comfort_score": <number>,
  "exercise_score": <number>,
  "indoor_comfort_score": <number>,
  "noise_stress_score": <number>,
  "red_flags": ["<string>", ...],
  "highlights": ["<string>", ...],
  "ai_summary": "<buyer-friendly summary mentioning pet names>",
  "agent_notes": "<strategic agent notes with marketing angles>",
  "scoring_details": {
    "traffic_safety": { "score": <number>, "reasoning": "<string>" },
    "yard": { "score": <number>, "reasoning": "<string>" },
    "senior_comfort": { "score": <number>, "reasoning": "<string>" },
    "exercise": { "score": <number>, "reasoning": "<string>" },
    "indoor_comfort": { "score": <number>, "reasoning": "<string>" },
    "noise_stress": { "score": <number>, "reasoning": "<string>" }
  },
  "species_insights": {
    "<dog|cat>": {
      "strengths": ["<string>", ...],
      "concerns": ["<string>", ...],
      "must_haves_met": ["<string>", ...],
      "must_haves_missing": ["<string>", ...],
      "dealbreaker_risk": "<low|moderate|high>"
    }
  },
  "marketing_tips": ["<string>", ...],
  "upgrade_suggestions": [
    { "name": "<string>", "impact": "<high|medium|low>", "description": "<string>", "estimated_cost": "<string>" }
  ]
}`;
}

export async function analyzeProperty(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext
): Promise<AnalysisResult> {
  if (!OPENAI_API_KEY) {
    console.log('No OpenAI API key — using fallback scoring engine');
    return generateFallbackAnalysis(property, pets, mapContext);
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(property, pets, mapContext) },
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from OpenAI');

    const result = JSON.parse(content) as AnalysisResult;

    if (typeof result.overall_score !== 'number' || !Array.isArray(result.red_flags)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    if (!result.species_insights) result.species_insights = {};
    if (!result.marketing_tips) result.marketing_tips = [];
    if (!result.upgrade_suggestions) result.upgrade_suggestions = [];

    return result;
  } catch (error) {
    console.error('OpenAI analysis failed, using fallback:', error);
    return generateFallbackAnalysis(property, pets, mapContext);
  }
}
