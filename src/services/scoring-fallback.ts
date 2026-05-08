import type {
  Property,
  PetProfile,
  MapContext,
  AnalysisResult,
  ScoringDetails,
  SpeciesInsights,
  SpeciesInsight,
  UpgradeSuggestion,
} from '@/types/database';

export function generateFallbackAnalysis(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext
): AnalysisResult {
  const desc = (property.listing_description || '').toLowerCase();
  const notes = (property.notes || '').toLowerCase();
  const combined = `${desc} ${notes}`;

  const trafficSafety = scoreTrafficSafety(property, mapContext, combined);
  const yard = scoreYard(property, pets, mapContext, combined);
  const seniorComfort = scoreSeniorComfort(property, pets, combined);
  const exercise = scoreExercise(property, pets, mapContext, combined);
  const indoorComfort = scoreIndoorComfort(property, pets, combined);
  const noiseStress = scoreNoiseStress(property, pets, mapContext, combined);

  const scores = [trafficSafety, yard, seniorComfort, exercise, indoorComfort, noiseStress];

  const dogs = pets.filter((p) => p.species === 'dog');
  const cats = pets.filter((p) => p.species === 'cat');

  const weights = calculateWeights(dogs, cats);
  let overall = 0;
  const scoreValues = [trafficSafety, yard, seniorComfort, exercise, indoorComfort, noiseStress];
  for (let i = 0; i < scoreValues.length; i++) {
    overall += scoreValues[i].score * weights[i];
  }
  overall = Math.round(overall);

  const redFlags = collectRedFlags(property, pets, mapContext, combined);
  const highlights = collectHighlights(property, pets, mapContext, combined);

  const speciesInsights = buildSpeciesInsights(property, dogs, cats, mapContext, combined);
  const marketingTips = generateMarketingTips(property, pets, mapContext, combined, highlights);
  const upgradeSuggestions = generateUpgradeSuggestions(property, pets, combined);

  const petNames = pets.map((p) => p.name).join(' and ');
  const scoringDetails: ScoringDetails = {
    traffic_safety: trafficSafety,
    yard,
    senior_comfort: seniorComfort,
    exercise,
    indoor_comfort: indoorComfort,
    noise_stress: noiseStress,
  };

  return {
    overall_score: overall,
    traffic_safety_score: trafficSafety.score,
    yard_score: yard.score,
    senior_comfort_score: seniorComfort.score,
    exercise_score: exercise.score,
    indoor_comfort_score: indoorComfort.score,
    noise_stress_score: noiseStress.score,
    red_flags: redFlags,
    highlights,
    ai_summary: buildSummary(overall, petNames, property, pets, scores),
    agent_notes: buildAgentNotes(property, pets, highlights, redFlags, marketingTips),
    scoring_details: scoringDetails,
    species_insights: speciesInsights,
    marketing_tips: marketingTips,
    upgrade_suggestions: upgradeSuggestions,
  };
}

function calculateWeights(dogs: PetProfile[], cats: PetProfile[]): number[] {
  // [traffic, yard, senior, exercise, indoor, noise]
  if (dogs.length > 0 && cats.length === 0) {
    return [0.20, 0.25, 0.10, 0.20, 0.10, 0.15];
  }
  if (cats.length > 0 && dogs.length === 0) {
    return [0.10, 0.05, 0.15, 0.10, 0.35, 0.25];
  }
  return [0.17, 0.17, 0.13, 0.17, 0.20, 0.16];
}

// ─── TRAFFIC SAFETY ─────────────────────────────────────────────────────────

function scoreTrafficSafety(
  property: Property,
  mapContext: MapContext,
  text: string
): { score: number; reasoning: string } {
  let score = 70;
  const reasons: string[] = [];

  if (mapContext.road_risk_level === 'high') {
    score -= 30;
    reasons.push('High road risk from nearby major roads');
  } else if (mapContext.road_risk_level === 'moderate') {
    score -= 15;
    reasons.push('Moderate road risk detected');
  } else {
    score += 10;
    reasons.push('Low road risk area');
  }

  if (text.includes('cul-de-sac') || text.includes('dead end')) {
    score += 12;
    reasons.push('Cul-de-sac/dead end — minimal through traffic');
  }
  if (text.includes('gated')) {
    score += 10;
    reasons.push('Gated community adds safety layer');
  }
  if (text.includes('highway') || text.includes('interstate') || text.includes('freeway')) {
    score -= 12;
    reasons.push('Highway proximity mentioned');
  }
  if (text.includes('busy') && (text.includes('road') || text.includes('street'))) {
    score -= 10;
    reasons.push('Busy road/street noted');
  }
  if (text.includes('quiet') || text.includes('peaceful')) {
    score += 7;
    reasons.push('Described as quiet/peaceful');
  }
  if (property.property_type === 'condo' || property.property_type === 'apartment') {
    score += 5;
    reasons.push('Indoor unit provides traffic buffer');
  }
  if (text.includes('sidewalk') || text.includes('walkable')) {
    score += 5;
    reasons.push('Sidewalks present — safer walking');
  }

  const fencing = property.fencing_type;
  if (fencing === 'privacy' || fencing === 'full') {
    score += 8;
    reasons.push('Secure fencing keeps pets away from roads');
  }

  return { score: clamp(score), reasoning: reasons.join('. ') + '.' };
}

// ─── YARD SUITABILITY ───────────────────────────────────────────────────────

function scoreYard(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext,
  text: string
): { score: number; reasoning: string } {
  let score = 40;
  const reasons: string[] = [];
  const hasDog = pets.some((p) => p.species === 'dog');
  const hasLargeDog = pets.some((p) => p.species === 'dog' && (p.size_category === 'large' || p.size_category === 'giant'));
  const highEnergyDog = pets.some((p) => p.species === 'dog' && (p.activity_level === 'high' || p.activity_level === 'very_high'));

  // Fencing is the #1 feature for dog owners
  const fencing = property.fencing_type;
  if (fencing === 'privacy') {
    score += 30;
    reasons.push('Privacy fence (6ft+) — the gold standard for pet security');
  } else if (fencing === 'full') {
    score += 25;
    reasons.push('Fully fenced yard — secure outdoor space');
  } else if (fencing === 'chain_link') {
    score += 15;
    reasons.push('Chain link fencing — visible but functional');
  } else if (fencing === 'partial') {
    score += 8;
    reasons.push('Partial fencing — may need completion for off-leash use');
  } else if (fencing === 'electric') {
    score += 5;
    reasons.push('Electric/invisible fence — requires training, not all pets respond');
  } else if (fencing === 'none' && hasDog) {
    score -= 10;
    reasons.push('No fencing — major concern for dog owners (often a dealbreaker)');
  }

  if (!fencing && (text.includes('fenced') && text.includes('yard'))) {
    score += 22;
    reasons.push('Fenced yard mentioned in listing');
  } else if (!fencing && (text.includes('yard') || text.includes('backyard'))) {
    score += 10;
    reasons.push('Yard mentioned but fencing unclear');
  }

  if (text.includes('acre') || (property.lot_size && property.lot_size !== 'N/A')) {
    score += 8;
    reasons.push('Meaningful lot size');
  }
  if (text.includes('shade') || text.includes('trees') || text.includes('mature')) {
    score += 5;
    reasons.push('Shade trees — outdoor comfort for pets');
  }
  if (text.includes('grass') || text.includes('lawn') || text.includes('turf')) {
    score += 5;
    reasons.push('Usable grass/lawn space');
  }
  if (text.includes('dog run') || text.includes('dog park') || text.includes('dog area')) {
    score += 8;
    reasons.push('Dedicated dog run/area');
  }

  if (property.property_type === 'condo' || property.property_type === 'apartment') {
    score -= 15;
    reasons.push('No private yard — condo/apartment');
    if (text.includes('dog run') || text.includes('dog park')) {
      score += 8;
      reasons.push('Building has shared dog amenity');
    }
    if (mapContext.nearby_parks.length > 0) {
      score += 5;
      reasons.push('Nearby parks compensate partially');
    }
  }

  if (property.has_screened_porch) {
    score += 7;
    reasons.push('Screened porch — safe outdoor access for cats or small pets');
  }

  if (hasLargeDog && score < 50) {
    reasons.push('Large dog needs more outdoor space than available');
  }
  if (highEnergyDog && score < 55) {
    reasons.push('High-energy dog needs substantial yard or very frequent park visits');
  }
  if (property.has_pool) {
    reasons.push('Pool present — supervision required for pets near water');
  }

  return { score: clamp(score), reasoning: reasons.join('. ') + '.' };
}

// ─── SENIOR COMFORT ─────────────────────────────────────────────────────────

function scoreSeniorComfort(
  property: Property,
  pets: PetProfile[],
  text: string
): { score: number; reasoning: string } {
  let score = 70;
  const reasons: string[] = [];
  const hasSenior = pets.some((p) => p.age_category === 'senior');
  const hasMobility = pets.some((p) => p.mobility_limitations);

  if (!hasSenior && !hasMobility) {
    return { score: 75, reasoning: 'No senior pets or mobility concerns. Scored as neutral.' };
  }

  const stories = property.stories;
  if (stories === 1 || text.includes('single-story') || text.includes('single story') || text.includes('ranch') || text.includes('rambler')) {
    score += 18;
    reasons.push('Single-story layout — no stairs for aging joints');
  } else if ((stories && stories > 1) || text.includes('stairs') || text.includes('split-level') || text.includes('multi-level')) {
    score -= 18;
    reasons.push('Multi-story with stairs — significant barrier for senior/mobility-limited pets');
  }

  if (text.includes('elevator')) {
    score += 8;
    reasons.push('Elevator access available');
  }

  // Flooring matters for senior pets
  const flooring = property.flooring_type;
  if (flooring === 'carpet') {
    score += 5;
    reasons.push('Carpet provides traction for arthritic pets');
  } else if (flooring === 'hardwood') {
    score -= 5;
    reasons.push('Hardwood can be slippery for senior pets — consider area rugs');
  } else if (flooring === 'lvp' || flooring === 'laminate') {
    score += 2;
    reasons.push('LVP/laminate — reasonable traction, easy to clean');
  } else if (flooring === 'tile') {
    score -= 3;
    reasons.push('Tile can be slippery and cold — area rugs recommended');
  }

  if (text.includes('sunroom') || text.includes('sun room')) {
    score += 7;
    reasons.push('Sunroom — warm resting area, natural light for aging pets');
  }
  if (text.includes('open floor') || text.includes('open concept')) {
    score += 5;
    reasons.push('Open layout — easier navigation');
  }
  if (text.includes('fireplace') || text.includes('radiant heat')) {
    score += 3;
    reasons.push('Warm features for comfort');
  }

  if (property.has_pet_door) {
    score += 5;
    reasons.push('Pet door — independent outdoor access without stairs help');
  }

  return { score: clamp(score), reasoning: reasons.join('. ') + '.' };
}

// ─── EXERCISE FRIENDLINESS ──────────────────────────────────────────────────

function scoreExercise(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext,
  text: string
): { score: number; reasoning: string } {
  let score = 45;
  const reasons: string[] = [];

  // Parks & trails
  const parkCount = mapContext.nearby_parks.length;
  const trailCount = mapContext.nearby_trails?.length || 0;
  score += Math.min(20, parkCount * 7);
  if (parkCount > 0) reasons.push(`${parkCount} park(s) nearby`);
  if (trailCount > 0) {
    score += Math.min(10, trailCount * 5);
    reasons.push(`${trailCount} trail(s) nearby`);
  }

  if (text.includes('trail') || text.includes('walking path') || text.includes('greenway')) {
    score += 8;
    reasons.push('Trail/walking path access');
  }
  if (text.includes('off-leash') || text.includes('off leash') || text.includes('dog park')) {
    score += 10;
    reasons.push('Off-leash area available');
  }
  if (text.includes('walkab') || (mapContext.walkability_estimate && mapContext.walkability_estimate > 60)) {
    score += 8;
    reasons.push('Good walkability');
  }
  if (text.includes('sidewalk')) {
    score += 5;
    reasons.push('Sidewalks for safe walking');
  }

  const sqft = property.sqft || 0;
  if (sqft > 2500) { score += 5; reasons.push('Large interior space'); }
  else if (sqft < 1000) { score -= 5; reasons.push('Compact interior'); }

  if (property.lot_size && property.lot_size !== 'N/A') {
    const lotText = property.lot_size.toLowerCase();
    if (lotText.includes('acre')) {
      const num = parseFloat(lotText);
      if (num >= 0.5) { score += 8; reasons.push('Half-acre+ lot for exercise'); }
      else if (num >= 0.25) { score += 5; reasons.push('Quarter-acre lot'); }
    }
  }

  const highEnergy = pets.some((p) => p.activity_level === 'high' || p.activity_level === 'very_high');
  if (highEnergy) {
    if (parkCount < 2 && !text.includes('trail')) {
      score -= 10;
      reasons.push('High-energy pet needs more exercise infrastructure');
    }
  }

  if (property.has_pet_door) {
    score += 3;
    reasons.push('Pet door enables free outdoor access');
  }

  return { score: clamp(score), reasoning: reasons.join('. ') + '.' };
}

// ─── INDOOR COMFORT ─────────────────────────────────────────────────────────

function scoreIndoorComfort(
  property: Property,
  pets: PetProfile[],
  text: string
): { score: number; reasoning: string } {
  let score = 55;
  const reasons: string[] = [];
  const hasCat = pets.some((p) => p.species === 'cat');
  const hasMultiple = pets.length > 1;

  // Flooring is critical for indoor comfort / durability
  const flooring = property.flooring_type;
  if (flooring === 'lvp') {
    score += 12;
    reasons.push('Luxury Vinyl Plank — the top pet-friendly flooring (waterproof, scratch-resistant, easy clean)');
  } else if (flooring === 'tile') {
    score += 10;
    reasons.push('Tile flooring — durable, waterproof, easy to clean');
  } else if (flooring === 'laminate') {
    score += 7;
    reasons.push('Laminate — scratch-resistant and affordable');
  } else if (flooring === 'hardwood') {
    score += 3;
    reasons.push('Hardwood — attractive but vulnerable to scratches and accidents');
  } else if (flooring === 'carpet') {
    score -= 8;
    reasons.push('Carpet — traps fur, stains from accidents, difficult with pets');
  }

  // Natural light (huge for cats, good for all)
  if (text.includes('window') || text.includes('natural light') || text.includes('floor-to-ceiling')) {
    score += 8;
    reasons.push('Good natural light/windows');
  }
  if (text.includes('sunroom') || text.includes('sun room')) {
    score += 10;
    reasons.push('Sunroom — premium indoor pet space');
  }
  if (text.includes('open concept') || text.includes('open floor')) {
    score += 5;
    reasons.push('Open concept layout — more roaming space');
  }
  if (text.includes('bonus room') || text.includes('flex room') || text.includes('den')) {
    score += 5;
    reasons.push('Bonus/flex room — potential pet zone');
  }

  // Built-in pet features
  if (property.has_mudroom) {
    score += 8;
    reasons.push('Mudroom — entry point for dirty paws, gear storage');
  }
  if (property.has_pet_wash_station) {
    score += 10;
    reasons.push('Pet wash station — high-value upgrade for pet owners');
  }
  if (property.has_pet_door) {
    score += 5;
    reasons.push('Pet door — indoor/outdoor freedom');
  }
  if (property.has_screened_porch) {
    score += 7;
    reasons.push('Screened porch — safe "outdoor" experience');
  }
  if (property.has_built_in_pet_features) {
    score += 8;
    reasons.push(`Built-in pet features: ${property.built_in_pet_features_desc || 'present'}`);
  }

  // Cat-specific
  if (hasCat) {
    if (text.includes('window') || text.includes('perch') || text.includes('ledge') || text.includes('bay window')) {
      score += 6;
      reasons.push('Window features excellent for cats');
    }
    if (text.includes('loft') || text.includes('vaulted') || text.includes('high ceiling')) {
      score += 5;
      reasons.push('Vertical space potential for cat climbing');
    }
    if (text.includes('quiet') || text.includes('calm')) {
      score += 5;
      reasons.push('Calm environment suits cats');
    }
    if (property.has_screened_porch) {
      score += 5;
      reasons.push('Screened porch doubles as a catio');
    }
  }

  // Space per pet
  const sqft = property.sqft || 0;
  if (hasMultiple) {
    if (sqft > 0 && sqft / pets.length < 500) {
      score -= 5;
      reasons.push('Tight space per pet in multi-pet household');
    }
  }
  if (sqft > 2000) score += 3;

  return { score: clamp(score), reasoning: reasons.join('. ') + '.' };
}

// ─── NOISE & STRESS ─────────────────────────────────────────────────────────

function scoreNoiseStress(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext,
  text: string
): { score: number; reasoning: string } {
  let score = 70;
  const reasons: string[] = [];
  const hasAnxious = pets.some((p) => p.anxiety_sensitivity === 'high');
  const hasCat = pets.some((p) => p.species === 'cat');

  if (mapContext.road_risk_level === 'high') {
    score -= 20;
    reasons.push('High traffic noise from nearby roads');
  } else if (mapContext.road_risk_level === 'moderate') {
    score -= 10;
    reasons.push('Some traffic noise expected');
  }

  if (text.includes('quiet') || text.includes('peaceful') || text.includes('serene') || text.includes('tranquil')) {
    score += 12;
    reasons.push('Described as quiet/peaceful');
  }
  if (text.includes('busy') || text.includes('urban') || text.includes('downtown') || text.includes('commercial')) {
    score -= 12;
    reasons.push('Urban/busy area — elevated noise');
  }
  if (text.includes('cul-de-sac') || text.includes('dead end')) {
    score += 8;
    reasons.push('Cul-de-sac — naturally quieter');
  }

  // Neighbor proximity (barking concerns for dog owners)
  const pets_have_dogs = pets.some((p) => p.species === 'dog');
  if (pets_have_dogs && (text.includes('detached') || property.property_type === 'single_family')) {
    score += 5;
    reasons.push('Detached home — less neighbor noise conflict (barking buffer)');
  }
  if (property.property_type === 'condo' || property.property_type === 'apartment' || property.property_type === 'townhouse') {
    score -= 5;
    reasons.push('Shared walls — noise both ways (neighbors hear barking, pets hear neighbors)');
  }

  if (hasAnxious) {
    score -= 8;
    reasons.push('High anxiety pet — noise sensitivity is magnified');
    if (text.includes('quiet') || text.includes('peaceful')) {
      score += 5;
    }
  }

  if (hasCat) {
    score -= 3;
    reasons.push('Cats are generally more noise-sensitive');
  }

  return { score: clamp(score), reasoning: reasons.join('. ') + '.' };
}

// ─── SPECIES-SPECIFIC INSIGHTS ──────────────────────────────────────────────

function buildSpeciesInsights(
  property: Property,
  dogs: PetProfile[],
  cats: PetProfile[],
  mapContext: MapContext,
  text: string
): SpeciesInsights {
  const insights: SpeciesInsights = {};

  if (dogs.length > 0) {
    insights.dog = buildDogInsight(property, dogs, mapContext, text);
  }
  if (cats.length > 0) {
    insights.cat = buildCatInsight(property, cats, text);
  }

  return insights;
}

function buildDogInsight(
  property: Property,
  dogs: PetProfile[],
  mapContext: MapContext,
  text: string
): SpeciesInsight {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const mustHavesMet: string[] = [];
  const mustHavesMissing: string[] = [];

  const fencing = property.fencing_type;
  const hasFence = fencing && fencing !== 'none';
  const hasYard = text.includes('yard') || text.includes('backyard') || hasFence;

  // Must-haves for dog owners
  if (hasFence && (fencing === 'full' || fencing === 'privacy')) {
    mustHavesMet.push('Securely fenced yard');
  } else if (hasYard && !hasFence) {
    mustHavesMissing.push('Yard needs fencing for off-leash safety');
  } else if (!hasYard && (property.property_type === 'condo' || property.property_type === 'apartment')) {
    mustHavesMissing.push('No private yard — #1 dealbreaker for most dog owners');
  }

  if (text.includes('sidewalk') || text.includes('walkable') || mapContext.walkability_estimate && mapContext.walkability_estimate > 50) {
    mustHavesMet.push('Walkable neighborhood');
  } else {
    mustHavesMissing.push('Limited walkability — dogs need safe walking routes');
  }

  if (mapContext.nearby_parks.length > 0) {
    mustHavesMet.push(`Nearby parks (${mapContext.nearby_parks.length})`);
  } else {
    mustHavesMissing.push('No parks found nearby');
  }

  // Strengths
  if (property.has_mudroom) strengths.push('Mudroom for messy paws and gear storage');
  if (property.has_pet_wash_station) strengths.push('Pet wash station — huge selling point');
  if (property.has_pet_door) strengths.push('Pet door for independent outdoor access');
  if (property.flooring_type === 'lvp' || property.flooring_type === 'tile') {
    strengths.push('Durable, scratch-resistant flooring');
  }
  if (property.stories === 1) strengths.push('Single-story — easy outdoor access');
  if (text.includes('shade') || text.includes('trees')) strengths.push('Shaded outdoor area');

  // Concerns
  if (property.flooring_type === 'carpet') concerns.push('Carpet will trap fur and stain from accidents');
  if (property.flooring_type === 'hardwood') concerns.push('Hardwood vulnerable to claw scratches');
  if (property.has_pool) concerns.push('Pool requires pet supervision — drowning risk');
  if (property.hoa_has_restrictions) {
    if (property.hoa_breed_restrictions) concerns.push(`HOA breed restrictions: ${property.hoa_breed_restrictions}`);
    if (property.hoa_pet_limit) concerns.push(`HOA limits ${property.hoa_pet_limit} pets`);
  }

  const hasLarge = dogs.some((d) => d.size_category === 'large' || d.size_category === 'giant');
  if (hasLarge && (property.sqft || 0) < 1200) {
    concerns.push('Space may feel tight for large dog(s)');
  }

  let dealbreakerRisk: 'low' | 'moderate' | 'high' = 'low';
  if (mustHavesMissing.length >= 2) dealbreakerRisk = 'high';
  else if (mustHavesMissing.length === 1) dealbreakerRisk = 'moderate';

  return {
    strengths,
    concerns,
    must_haves_met: mustHavesMet,
    must_haves_missing: mustHavesMissing,
    dealbreaker_risk: dealbreakerRisk,
  };
}

function buildCatInsight(
  property: Property,
  cats: PetProfile[],
  text: string
): SpeciesInsight {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const mustHavesMet: string[] = [];
  const mustHavesMissing: string[] = [];

  // Cat must-haves: light, quiet, interior layout
  if (text.includes('window') || text.includes('natural light') || text.includes('sunroom') || text.includes('bay window')) {
    mustHavesMet.push('Good natural light and window access');
  } else {
    mustHavesMissing.push('Cats need windows and natural light for wellbeing');
  }

  if (text.includes('quiet') || text.includes('peaceful') || text.includes('cul-de-sac')) {
    mustHavesMet.push('Quiet environment');
  } else if (text.includes('busy') || text.includes('downtown') || text.includes('urban')) {
    mustHavesMissing.push('Noisy environment stresses cats');
  }

  // Strengths
  if (property.has_screened_porch) strengths.push('Screened porch = instant catio');
  if (text.includes('loft') || text.includes('vaulted') || text.includes('high ceiling') || text.includes('bonus room')) {
    strengths.push('Vertical space and bonus areas for climbing/exploring');
  }
  if (property.flooring_type && property.flooring_type !== 'carpet') {
    strengths.push('Non-carpet flooring — easier litter and hairball cleanup');
  }
  if (text.includes('sunroom')) strengths.push('Sunroom — cat paradise for sunbathing');
  if ((property.sqft || 0) > 1500) strengths.push('Spacious interior for cat exploration');
  if (text.includes('closet') || text.includes('laundry') || text.includes('utility')) {
    strengths.push('Spaces for discreet litter box placement');
  }

  // Concerns
  if (property.flooring_type === 'carpet') concerns.push('Carpet harder to clean — fur, litter tracking, hairballs');
  if (property.has_pool) concerns.push('Outdoor pool area needs supervision');

  const hasAnxious = cats.some((c) => c.anxiety_sensitivity === 'high');
  if (hasAnxious && !text.includes('quiet')) {
    concerns.push('Noise-sensitive cat may struggle without confirmed quiet setting');
  }

  if (property.hoa_has_restrictions && property.hoa_pet_limit) {
    if (cats.length > property.hoa_pet_limit) {
      concerns.push(`HOA limits ${property.hoa_pet_limit} pets — you have ${cats.length} cat(s)`);
    }
  }

  let dealbreakerRisk: 'low' | 'moderate' | 'high' = 'low';
  if (mustHavesMissing.length >= 2) dealbreakerRisk = 'moderate';

  return {
    strengths,
    concerns,
    must_haves_met: mustHavesMet,
    must_haves_missing: mustHavesMissing,
    dealbreaker_risk: dealbreakerRisk,
  };
}

// ─── RED FLAGS & HIGHLIGHTS ─────────────────────────────────────────────────

function collectRedFlags(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext,
  text: string
): string[] {
  const flags: string[] = [];

  if (mapContext.road_risk_level === 'high') {
    flags.push('Property is near major roads — significant traffic risk for outdoor pets');
  }
  if (pets.some((p) => p.escape_risk === 'high') && property.fencing_type !== 'full' && property.fencing_type !== 'privacy' && !text.includes('fenced')) {
    flags.push('High-escape-risk pet with inadequate fencing — #1 safety concern');
  }
  if (
    pets.some((p) => p.species === 'dog' && (p.activity_level === 'high' || p.activity_level === 'very_high')) &&
    (property.sqft || 0) < 1200 && !property.fencing_type
  ) {
    flags.push('High-energy dog in small space with no yard — likely behavioral issues');
  }
  if (pets.some((p) => p.mobility_limitations) && (property.stories || 0) > 1 && !text.includes('elevator')) {
    flags.push('Mobility-limited pet in multi-story home without elevator');
  }
  if (mapContext.nearby_vets.length === 0) {
    flags.push('No veterinary clinics found within 2km');
  }
  if (
    pets.some((p) => p.anxiety_sensitivity === 'high') &&
    (text.includes('highway') || text.includes('busy') || mapContext.road_risk_level === 'high')
  ) {
    flags.push('Noise-sensitive pet near high-traffic area');
  }
  if (property.property_type === 'condo' && pets.some((p) => p.escape_risk === 'high')) {
    flags.push('High-rise unit with escape-risk pet — balcony safety concern');
  }
  if (property.flooring_type === 'carpet' && pets.some((p) => p.species === 'dog' && (p.age_category === 'puppy_kitten' || p.age_category === 'young'))) {
    flags.push('Carpet flooring with young dog — expect staining and difficult cleaning');
  }
  if (property.hoa_has_restrictions) {
    if (property.hoa_breed_restrictions) {
      flags.push(`HOA breed restrictions — verify ${pets.filter((p) => p.species === 'dog').map((p) => p.breed || 'breed').join(', ')} is allowed`);
    }
    if (property.hoa_pet_limit && pets.length > property.hoa_pet_limit) {
      flags.push(`HOA allows only ${property.hoa_pet_limit} pet(s) — buyer has ${pets.length}`);
    }
  }
  if (property.has_pool && pets.some((p) => p.species === 'dog' && (p.age_category === 'puppy_kitten' || p.age_category === 'senior'))) {
    flags.push('Pool with young/senior pet — drowning risk, may need pool fence');
  }

  return flags;
}

function collectHighlights(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext,
  text: string
): string[] {
  const highlights: string[] = [];

  if (property.fencing_type === 'privacy' || property.fencing_type === 'full') {
    highlights.push('Securely fenced yard — the #1 feature pet-buying households want');
  }
  if (property.flooring_type === 'lvp' || property.flooring_type === 'tile') {
    highlights.push(`${property.flooring_type === 'lvp' ? 'Luxury vinyl plank' : 'Tile'} flooring — durable, waterproof, pet-proof`);
  }
  if (property.has_pet_wash_station) {
    highlights.push('Pet wash station — high-impact upgrade that impresses buyers');
  }
  if (property.has_mudroom) {
    highlights.push('Mudroom — practical entry point for pets and gear');
  }
  if (property.has_screened_porch) {
    highlights.push('Screened porch — safe outdoor access, doubles as a catio');
  }
  if (property.has_pet_door) {
    highlights.push('Pet door — enables independent indoor/outdoor access');
  }
  if (property.has_built_in_pet_features) {
    highlights.push(`Built-in pet features: ${property.built_in_pet_features_desc || 'custom pet amenities'}`);
  }

  if (mapContext.nearby_parks.length >= 2) {
    highlights.push(`${mapContext.nearby_parks.length} parks within walking distance`);
  } else if (mapContext.nearby_parks.length === 1) {
    highlights.push(`${mapContext.nearby_parks[0].name} nearby`);
  }

  if (property.stories === 1 && pets.some((p) => p.age_category === 'senior' || p.mobility_limitations)) {
    highlights.push('Single-story layout — ideal for senior or mobility-limited pets');
  }
  if (text.includes('sunroom')) highlights.push('Sunroom for natural light and pet lounging');
  if (mapContext.road_risk_level === 'low') highlights.push('Low traffic area — safer for outdoor pets');
  if (mapContext.nearby_vets.length > 0) highlights.push(`Veterinary care nearby (${mapContext.nearby_vets[0].name})`);
  if (text.includes('quiet') || text.includes('cul-de-sac')) highlights.push('Quiet neighborhood');
  if (text.includes('shade') || text.includes('trees')) highlights.push('Shade trees for outdoor comfort');

  if (mapContext.nearby_groomers && mapContext.nearby_groomers.length > 0) {
    highlights.push('Groomer accessible nearby');
  }

  return highlights;
}

// ─── MARKETING TIPS ─────────────────────────────────────────────────────────

function generateMarketingTips(
  property: Property,
  pets: PetProfile[],
  mapContext: MapContext,
  text: string,
  highlights: string[]
): string[] {
  const tips: string[] = [];
  const hasDog = pets.some((p) => p.species === 'dog');

  if (property.fencing_type === 'full' || property.fencing_type === 'privacy' || text.includes('fenced')) {
    tips.push('Lead with "fully fenced backyard perfect for pets" — this is the #1 conversion phrase for pet owners');
  }
  if (property.flooring_type === 'lvp' || property.flooring_type === 'tile' || property.flooring_type === 'laminate') {
    tips.push('Highlight "scratch-resistant flooring throughout" in the listing');
  }
  if (property.has_pet_wash_station) {
    tips.push('Feature the pet wash station prominently — it\'s an emotional "wow" upgrade');
  }
  if (mapContext.nearby_parks.length > 0 || text.includes('trail')) {
    tips.push('Mention proximity to parks and trails — "dog-friendly neighborhood with nearby walking trails"');
  }
  if (mapContext.nearby_vets.length > 0) {
    tips.push('Note "minutes from veterinary services" — builds trust');
  }

  if (!property.hoa_has_restrictions) {
    tips.push('Highlight "no HOA pet restrictions" — this builds trust fast and prevents deals from falling apart');
  } else if (property.hoa_pet_policy) {
    tips.push('Disclose HOA pet policy upfront — transparency prevents late-stage deal collapse');
  }

  if (hasDog) {
    tips.push('Show yard clearly in photos — wide angles with fencing visible');
    tips.push('Stage entry/mudroom area as a pet-friendly zone');
  }

  if (highlights.length >= 3) {
    tips.push('Use keywords "pet-friendly home" and "ideal for pet lovers" in listing title/description');
  }

  tips.push('Consider targeted social media ads to pet owner demographics — they are emotionally driven and move faster when a home fits their pets');

  return tips;
}

// ─── UPGRADE SUGGESTIONS ────────────────────────────────────────────────────

function generateUpgradeSuggestions(
  property: Property,
  pets: PetProfile[],
  text: string
): UpgradeSuggestion[] {
  const suggestions: UpgradeSuggestion[] = [];
  const hasDog = pets.some((p) => p.species === 'dog');
  const hasCat = pets.some((p) => p.species === 'cat');

  if (!property.fencing_type || property.fencing_type === 'none' || property.fencing_type === 'partial') {
    if (property.property_type === 'single_family' || property.property_type === 'townhouse') {
      suggestions.push({
        name: 'Install full perimeter fencing',
        impact: 'high',
        description: 'The single highest-ROI upgrade for pet-owning buyers. Privacy fence (6ft) is gold standard.',
        estimated_cost: '$3,000–$8,000',
      });
    }
  }

  if (property.flooring_type === 'carpet') {
    suggestions.push({
      name: 'Replace carpet with LVP or tile',
      impact: 'high',
      description: 'Carpet is the #1 interior complaint from pet owners. LVP is waterproof, scratch-resistant, and affordable.',
      estimated_cost: '$3–$7/sqft',
    });
  }

  if (!property.has_pet_wash_station && hasDog) {
    suggestions.push({
      name: 'Add a pet washing station',
      impact: 'medium',
      description: 'Can be added in laundry room, mudroom, or garage. High emotional impact at showings.',
      estimated_cost: '$500–$2,000',
    });
  }

  if (!property.has_screened_porch && hasCat) {
    suggestions.push({
      name: 'Add screened porch or catio',
      impact: 'medium',
      description: 'Safe outdoor experience for cats. Increasingly popular — can be a listing differentiator.',
      estimated_cost: '$1,000–$5,000',
    });
  }

  if (!property.has_pet_door && hasDog) {
    suggestions.push({
      name: 'Install smart pet door',
      impact: 'medium',
      description: 'Secure, microchip-activated pet doors let pets in/out independently. Great marketing feature.',
      estimated_cost: '$200–$800',
    });
  }

  if (!property.has_mudroom && hasDog && !text.includes('mudroom')) {
    suggestions.push({
      name: 'Create a mudroom or pet entry zone',
      impact: 'medium',
      description: 'Designate an entry area with hooks, storage, and easy-clean flooring for post-walk cleanup.',
      estimated_cost: '$500–$3,000',
    });
  }

  if (property.flooring_type === 'hardwood') {
    suggestions.push({
      name: 'Apply scratch-resistant floor coating',
      impact: 'low',
      description: 'Polyurethane or hardwax oil protects hardwood from claw damage. Mention "scratch-resistant hardwood" in listing.',
      estimated_cost: '$1–$3/sqft',
    });
  }

  return suggestions;
}

// ─── SUMMARY BUILDERS ───────────────────────────────────────────────────────

function buildSummary(
  overall: number,
  petNames: string,
  property: Property,
  pets: PetProfile[],
  scores: { score: number }[]
): string {
  const rating = overall >= 80 ? 'an excellent' : overall >= 60 ? 'a solid' : overall >= 40 ? 'a moderate' : 'a challenging';
  const best = Math.max(...scores.map((s) => s.score));
  const bestIdx = scores.findIndex((s) => s.score === best);
  const labels = ['traffic safety', 'yard suitability', 'senior comfort', 'exercise access', 'indoor comfort', 'noise environment'];

  let summary = `This property is ${rating} match for ${petNames}, scoring ${overall}/100 overall. `;
  summary += `Its strongest area is ${labels[bestIdx]} (${best}/100). `;

  if (overall >= 70) {
    summary += 'This home has strong pet-friendly fundamentals that will appeal to animal-loving buyers.';
  } else if (overall >= 50) {
    summary += 'With some targeted improvements, this could become a compelling option for pet owners.';
  } else {
    summary += 'Significant compromises would be needed to make this work for the pet(s) described.';
  }

  summary += ' (Rule-based analysis — enable OpenAI for AI-powered narrative insights.)';
  return summary;
}

function buildAgentNotes(
  property: Property,
  pets: PetProfile[],
  highlights: string[],
  redFlags: string[],
  marketingTips: string[]
): string {
  const parts: string[] = [];

  if (highlights.length > 0) {
    parts.push(`Key selling points: ${highlights.slice(0, 3).join('; ')}.`);
  }
  if (redFlags.length > 0) {
    parts.push(`Address proactively: ${redFlags[0]}.`);
  }
  if (marketingTips.length > 0) {
    parts.push(`Marketing tip: ${marketingTips[0]}`);
  }

  const hasDog = pets.some((p) => p.species === 'dog');
  if (hasDog) {
    parts.push('Dog owners are emotionally driven — if the yard and neighborhood feel right, they will move fast. Lead with outdoor features during the showing.');
  }

  parts.push('(Fallback scoring — configure OPENAI_API_KEY for detailed strategic agent notes.)');
  return parts.join(' ');
}

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
