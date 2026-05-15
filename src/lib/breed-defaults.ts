import type { PetProfile } from '@/types/database';

type BreedDefault = {
  species: 'dog' | 'cat';
  size: PetProfile['size_category'];
  activity: PetProfile['activity_level'];
  escape_risk: PetProfile['escape_risk'];
  anxiety: PetProfile['anxiety_sensitivity'];
  notes?: string;
};

const DOG_BREEDS: Record<string, BreedDefault> = {
  'labrador retriever': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'labrador': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'lab': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'golden retriever': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'golden': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'german shepherd': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'moderate', anxiety: 'moderate' },
  'french bulldog': { species: 'dog', size: 'small', activity: 'low', escape_risk: 'low', anxiety: 'moderate', notes: 'Brachycephalic — sensitive to heat/exercise extremes' },
  'frenchie': { species: 'dog', size: 'small', activity: 'low', escape_risk: 'low', anxiety: 'moderate' },
  'bulldog': { species: 'dog', size: 'medium', activity: 'low', escape_risk: 'low', anxiety: 'low', notes: 'Brachycephalic — heat sensitive' },
  'english bulldog': { species: 'dog', size: 'medium', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'poodle': { species: 'dog', size: 'medium', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate' },
  'standard poodle': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'moderate' },
  'mini poodle': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate' },
  'toy poodle': { species: 'dog', size: 'tiny', activity: 'moderate', escape_risk: 'low', anxiety: 'high' },
  'goldendoodle': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'labradoodle': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'low' },
  'cockapoo': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate' },
  'bernedoodle': { species: 'dog', size: 'large', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'beagle': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'high', anxiety: 'low', notes: 'Scent hound — known wanderers, secure fencing critical' },
  'rottweiler': { species: 'dog', size: 'large', activity: 'moderate', escape_risk: 'low', anxiety: 'low', notes: 'Often restricted by HOAs/insurance' },
  'german shorthaired pointer': { species: 'dog', size: 'large', activity: 'very_high', escape_risk: 'moderate', anxiety: 'moderate' },
  'pointer': { species: 'dog', size: 'large', activity: 'very_high', escape_risk: 'moderate', anxiety: 'moderate' },
  'dachshund': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate', notes: 'Back issues — avoid stairs' },
  'yorkshire terrier': { species: 'dog', size: 'tiny', activity: 'moderate', escape_risk: 'low', anxiety: 'high' },
  'yorkie': { species: 'dog', size: 'tiny', activity: 'moderate', escape_risk: 'low', anxiety: 'high' },
  'boxer': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'moderate', anxiety: 'moderate' },
  'siberian husky': { species: 'dog', size: 'large', activity: 'very_high', escape_risk: 'high', anxiety: 'low', notes: 'Notorious escape artists — 6ft+ fencing required' },
  'husky': { species: 'dog', size: 'large', activity: 'very_high', escape_risk: 'high', anxiety: 'low' },
  'great dane': { species: 'dog', size: 'giant', activity: 'moderate', escape_risk: 'low', anxiety: 'low', notes: 'Needs space, short lifespan, joint issues' },
  'doberman': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'high', notes: 'Often HOA-restricted' },
  'doberman pinscher': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'low', anxiety: 'high' },
  'australian shepherd': { species: 'dog', size: 'medium', activity: 'very_high', escape_risk: 'moderate', anxiety: 'moderate', notes: 'Needs mental stimulation' },
  'aussie': { species: 'dog', size: 'medium', activity: 'very_high', escape_risk: 'moderate', anxiety: 'moderate' },
  'border collie': { species: 'dog', size: 'medium', activity: 'very_high', escape_risk: 'high', anxiety: 'moderate', notes: 'Highest-energy breed — needs daily intense exercise + mental work' },
  'shih tzu': { species: 'dog', size: 'tiny', activity: 'low', escape_risk: 'low', anxiety: 'moderate' },
  'pomeranian': { species: 'dog', size: 'tiny', activity: 'moderate', escape_risk: 'low', anxiety: 'high' },
  'cavalier king charles spaniel': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate' },
  'cavalier': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate' },
  'shiba inu': { species: 'dog', size: 'small', activity: 'high', escape_risk: 'high', anxiety: 'moderate', notes: 'Known escape artists — secure yard a must' },
  'corgi': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'pembroke welsh corgi': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'chihuahua': { species: 'dog', size: 'tiny', activity: 'moderate', escape_risk: 'moderate', anxiety: 'high' },
  'pug': { species: 'dog', size: 'small', activity: 'low', escape_risk: 'low', anxiety: 'moderate', notes: 'Brachycephalic — heat sensitive' },
  'great pyrenees': { species: 'dog', size: 'giant', activity: 'moderate', escape_risk: 'moderate', anxiety: 'low', notes: 'Tendency to roam — high fencing important' },
  'bernese mountain dog': { species: 'dog', size: 'giant', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'pit bull': { species: 'dog', size: 'medium', activity: 'high', escape_risk: 'moderate', anxiety: 'moderate', notes: 'Often HOA/insurance restricted — verify policies' },
  'american pit bull terrier': { species: 'dog', size: 'medium', activity: 'high', escape_risk: 'moderate', anxiety: 'moderate' },
  'staffordshire terrier': { species: 'dog', size: 'medium', activity: 'high', escape_risk: 'moderate', anxiety: 'moderate' },
  'jack russell': { species: 'dog', size: 'small', activity: 'very_high', escape_risk: 'high', anxiety: 'moderate', notes: 'Very high prey drive — escape risk for small animals' },
  'jack russell terrier': { species: 'dog', size: 'small', activity: 'very_high', escape_risk: 'high', anxiety: 'moderate' },
  'maltese': { species: 'dog', size: 'tiny', activity: 'low', escape_risk: 'low', anxiety: 'moderate' },
  'havanese': { species: 'dog', size: 'small', activity: 'moderate', escape_risk: 'low', anxiety: 'moderate' },
  'mastiff': { species: 'dog', size: 'giant', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'akita': { species: 'dog', size: 'large', activity: 'moderate', escape_risk: 'moderate', anxiety: 'moderate', notes: 'Often HOA-restricted' },
  'samoyed': { species: 'dog', size: 'large', activity: 'high', escape_risk: 'moderate', anxiety: 'low' },
  'newfoundland': { species: 'dog', size: 'giant', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'st bernard': { species: 'dog', size: 'giant', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'saint bernard': { species: 'dog', size: 'giant', activity: 'low', escape_risk: 'low', anxiety: 'low' },
};

const CAT_BREEDS: Record<string, BreedDefault> = {
  'maine coon': { species: 'cat', size: 'large', activity: 'moderate', escape_risk: 'low', anxiety: 'low', notes: 'Large, gentle giant — needs vertical space' },
  'persian': { species: 'cat', size: 'medium', activity: 'low', escape_risk: 'low', anxiety: 'moderate' },
  'siamese': { species: 'cat', size: 'medium', activity: 'high', escape_risk: 'moderate', anxiety: 'high', notes: 'Vocal, social, needs interaction' },
  'ragdoll': { species: 'cat', size: 'large', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'bengal': { species: 'cat', size: 'medium', activity: 'very_high', escape_risk: 'high', anxiety: 'moderate', notes: 'Very active, needs enrichment, may escape' },
  'sphynx': { species: 'cat', size: 'medium', activity: 'high', escape_risk: 'moderate', anxiety: 'moderate', notes: 'Hairless — sensitive to cold' },
  'british shorthair': { species: 'cat', size: 'medium', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'american shorthair': { species: 'cat', size: 'medium', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'russian blue': { species: 'cat', size: 'medium', activity: 'moderate', escape_risk: 'low', anxiety: 'high' },
  'abyssinian': { species: 'cat', size: 'small', activity: 'very_high', escape_risk: 'moderate', anxiety: 'moderate' },
  'scottish fold': { species: 'cat', size: 'medium', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'norwegian forest cat': { species: 'cat', size: 'large', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'domestic shorthair': { species: 'cat', size: 'medium', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
  'domestic longhair': { species: 'cat', size: 'medium', activity: 'low', escape_risk: 'low', anxiety: 'low' },
  'tabby': { species: 'cat', size: 'medium', activity: 'moderate', escape_risk: 'low', anxiety: 'low' },
};

const ALL_BREEDS = { ...DOG_BREEDS, ...CAT_BREEDS };

export function findBreedDefaults(breedInput: string): BreedDefault | null {
  if (!breedInput) return null;
  const key = breedInput.trim().toLowerCase();
  if (ALL_BREEDS[key]) return ALL_BREEDS[key];
  for (const [breed, defaults] of Object.entries(ALL_BREEDS)) {
    if (key.includes(breed) || breed.includes(key)) {
      return defaults;
    }
  }
  return null;
}

export function getBreedSuggestions(query: string, species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const pool = species === 'cat' ? CAT_BREEDS : species === 'dog' ? DOG_BREEDS : ALL_BREEDS;
  return Object.keys(pool)
    .filter((b) => b.startsWith(q) || b.includes(q))
    .slice(0, 8)
    .map((b) => b.replace(/\b\w/g, (c) => c.toUpperCase()));
}
