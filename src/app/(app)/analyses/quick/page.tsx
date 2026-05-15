'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Wand2,
  PawPrint,
  Home as HomeIcon,
  ChevronDown,
  ChevronUp,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Settings2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import { findBreedDefaults, getBreedSuggestions } from '@/lib/breed-defaults';
import { isDemoMode } from '@/lib/demo-mode';
import type { PetProfile, FlooringType, FencingType } from '@/types/database';

interface QuickPet {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  age_category: PetProfile['age_category'];
  size_category: PetProfile['size_category'];
  activity_level: PetProfile['activity_level'];
  indoor_outdoor: PetProfile['indoor_outdoor'];
  anxiety_sensitivity: PetProfile['anxiety_sensitivity'];
  escape_risk: PetProfile['escape_risk'];
  mobility_limitations: string;
  special_notes: string;
}

interface ExtractedProperty {
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
  extraction_confidence?: 'high' | 'medium' | 'low';
  notes_for_agent?: string;
}

function emptyPet(): QuickPet {
  return {
    name: '',
    species: 'dog',
    breed: '',
    age_category: 'adult',
    size_category: 'medium',
    activity_level: 'moderate',
    indoor_outdoor: 'both',
    anxiety_sensitivity: 'low',
    escape_risk: 'low',
    mobility_limitations: '',
    special_notes: '',
  };
}

export default function QuickAnalyzePage() {
  const router = useRouter();
  const [listingText, setListingText] = useState('');
  const [address, setAddress] = useState('');
  const [pets, setPets] = useState<QuickPet[]>([emptyPet()]);
  const [extracted, setExtracted] = useState<ExtractedProperty | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [breedSuggestions, setBreedSuggestions] = useState<Record<number, string[]>>({});

  async function handleExtract() {
    if (!listingText.trim() || listingText.trim().length < 20) {
      setError('Please paste at least a few sentences from the listing.');
      return;
    }
    setError(null);
    setExtracting(true);
    try {
      const res = await fetch('/api/extract-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: listingText }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to extract listing data.');
      }
      const { extracted: data } = await res.json();
      setExtracted(data);
      if (data.address && !address) setAddress(data.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }

  function updatePet(index: number, updates: Partial<QuickPet>) {
    setPets((prev) => prev.map((p, i) => (i === index ? { ...p, ...updates } : p)));
  }

  function handleBreedChange(index: number, value: string) {
    updatePet(index, { breed: value });
    const suggestions = getBreedSuggestions(value, pets[index].species);
    setBreedSuggestions((prev) => ({ ...prev, [index]: suggestions }));
  }

  function applyBreedDefaults(index: number, breed: string) {
    const defaults = findBreedDefaults(breed);
    if (!defaults) return;
    updatePet(index, {
      breed,
      species: defaults.species,
      size_category: defaults.size,
      activity_level: defaults.activity,
      escape_risk: defaults.escape_risk,
      anxiety_sensitivity: defaults.anxiety,
      special_notes: defaults.notes || pets[index].special_notes,
    });
    setBreedSuggestions((prev) => ({ ...prev, [index]: [] }));
  }

  function addPet() {
    setPets((prev) => [...prev, emptyPet()]);
  }

  function removePet(index: number) {
    if (pets.length === 1) return;
    setPets((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleScore() {
    setError(null);

    const finalAddress = address.trim() || extracted?.address?.trim() || '';
    if (!finalAddress || finalAddress.length < 5) {
      setError('Please enter the property address.');
      return;
    }

    const emptyNames = pets.filter((p) => !p.name.trim());
    if (emptyNames.length > 0) {
      setError('Please enter a name for every pet.');
      return;
    }

    setScoring(true);

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      setScoring(false);
      router.push('/analyses/mock-analysis-1');
      return;
    }

    try {
      const property = {
        address: finalAddress,
        city: extracted?.city || '',
        state: extracted?.state || '',
        postal_code: extracted?.postal_code || '',
        property_type: extracted?.property_type || 'single_family',
        beds: extracted?.beds,
        baths: extracted?.baths,
        sqft: extracted?.sqft,
        lot_size: extracted?.lot_size || '',
        stories: extracted?.stories,
        flooring_type: extracted?.flooring_type,
        fencing_type: extracted?.fencing_type,
        has_mudroom: extracted?.has_mudroom || false,
        has_pet_door: extracted?.has_pet_door || false,
        has_pet_wash_station: extracted?.has_pet_wash_station || false,
        has_screened_porch: extracted?.has_screened_porch || false,
        has_pool: extracted?.has_pool || false,
        has_built_in_pet_features: extracted?.has_built_in_pet_features || false,
        built_in_pet_features_desc: extracted?.built_in_pet_features_desc || '',
        hoa_has_restrictions: extracted?.hoa_has_restrictions || false,
        hoa_pet_policy: extracted?.hoa_pet_policy || '',
        hoa_breed_restrictions: extracted?.hoa_breed_restrictions || '',
        hoa_pet_limit: extracted?.hoa_pet_limit,
        listing_description: extracted?.listing_description || listingText,
        notes: '',
      };

      const formData = new FormData();
      formData.append('property', JSON.stringify(property));
      formData.append('pets', JSON.stringify(pets));

      const res = await fetch('/api/analyses', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create analysis.');
      }

      const data = await res.json();
      router.push(`/analyses/${data.analysis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setScoring(false);
    }
  }

  const confidenceColor =
    extracted?.extraction_confidence === 'high'
      ? 'text-green-700 bg-green-50 border-green-200'
      : extracted?.extraction_confidence === 'medium'
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-gray-700 bg-gray-50 border-gray-200';

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Quick Analyze"
        description="Paste a listing, pick a pet, get a report. Under 60 seconds."
        action={
          <Link href="/analyses/new">
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4" />
              Advanced Entry
            </Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <CardTitle>1. Paste the listing</CardTitle>
        </div>
        <p className="mb-3 text-sm text-gray-500">
          Drop in the MLS, Zillow, or Redfin description. AI will pull out beds, baths, sqft,
          flooring, fencing, pet features, and HOA details automatically.
        </p>
        <Textarea
          placeholder="Paste the full listing description here — e.g., 'Charming 3-bed ranch with fully fenced backyard, hardwood floors throughout, mudroom off the garage...'"
          rows={6}
          value={listingText}
          onChange={(e) => setListingText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={handleExtract} loading={extracting} disabled={listingText.trim().length < 20}>
            <Wand2 className="h-4 w-4" />
            Extract Property Details
          </Button>
          {extracted && !extracting && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${confidenceColor}`}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Extracted ({extracted.extraction_confidence || 'medium'} confidence)
            </span>
          )}
        </div>

        {extracted && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">What we found</h4>
              <button
                type="button"
                onClick={() => setShowDetails((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showDetails ? 'Hide' : 'Review & edit'}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {extracted.beds != null && <Chip>{extracted.beds} bed</Chip>}
              {extracted.baths != null && <Chip>{extracted.baths} bath</Chip>}
              {extracted.sqft != null && <Chip>{extracted.sqft.toLocaleString()} sqft</Chip>}
              {extracted.lot_size && <Chip>Lot: {extracted.lot_size}</Chip>}
              {extracted.stories != null && <Chip>{extracted.stories} story</Chip>}
              {extracted.property_type && <Chip className="capitalize">{extracted.property_type.replace('_', ' ')}</Chip>}
              {extracted.flooring_type && <Chip className="capitalize">Floor: {extracted.flooring_type}</Chip>}
              {extracted.fencing_type && <Chip className="capitalize">Fence: {extracted.fencing_type.replace('_', ' ')}</Chip>}
              {extracted.has_mudroom && <Chip>Mudroom</Chip>}
              {extracted.has_pet_door && <Chip>Pet door</Chip>}
              {extracted.has_pet_wash_station && <Chip>Pet wash</Chip>}
              {extracted.has_screened_porch && <Chip>Screened porch</Chip>}
              {extracted.has_pool && <Chip>Pool</Chip>}
              {extracted.hoa_has_restrictions && <Chip className="border-amber-300 bg-amber-50 text-amber-700">HOA restrictions</Chip>}
            </div>

            {extracted.notes_for_agent && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                {extracted.notes_for_agent}
              </p>
            )}

            {showDetails && (
              <div className="mt-4 grid gap-3 border-t border-gray-200 pt-4 sm:grid-cols-2">
                <Input
                  label="City"
                  value={extracted.city || ''}
                  onChange={(e) => setExtracted({ ...extracted, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={extracted.state || ''}
                  onChange={(e) => setExtracted({ ...extracted, state: e.target.value })}
                />
                <Input
                  label="Beds"
                  type="number"
                  value={extracted.beds ?? ''}
                  onChange={(e) => setExtracted({ ...extracted, beds: e.target.value ? Number(e.target.value) : undefined })}
                />
                <Input
                  label="Baths"
                  type="number"
                  step="0.5"
                  value={extracted.baths ?? ''}
                  onChange={(e) => setExtracted({ ...extracted, baths: e.target.value ? Number(e.target.value) : undefined })}
                />
                <Input
                  label="Sqft"
                  type="number"
                  value={extracted.sqft ?? ''}
                  onChange={(e) => setExtracted({ ...extracted, sqft: e.target.value ? Number(e.target.value) : undefined })}
                />
                <Input
                  label="Lot size"
                  value={extracted.lot_size || ''}
                  onChange={(e) => setExtracted({ ...extracted, lot_size: e.target.value })}
                />
                <Select
                  label="Flooring"
                  value={extracted.flooring_type || ''}
                  onChange={(e) => setExtracted({ ...extracted, flooring_type: (e.target.value || undefined) as FlooringType | undefined })}
                  options={[
                    { value: '', label: 'Unknown / mixed' },
                    { value: 'hardwood', label: 'Hardwood' },
                    { value: 'lvp', label: 'LVP / luxury vinyl' },
                    { value: 'tile', label: 'Tile' },
                    { value: 'laminate', label: 'Laminate' },
                    { value: 'carpet', label: 'Carpet' },
                    { value: 'mixed', label: 'Mixed' },
                  ]}
                />
                <Select
                  label="Fencing"
                  value={extracted.fencing_type || ''}
                  onChange={(e) => setExtracted({ ...extracted, fencing_type: (e.target.value || undefined) as FencingType | undefined })}
                  options={[
                    { value: '', label: 'Unknown' },
                    { value: 'none', label: 'No fence' },
                    { value: 'partial', label: 'Partial' },
                    { value: 'full', label: 'Full' },
                    { value: 'privacy', label: 'Privacy (6ft+)' },
                    { value: 'chain_link', label: 'Chain link' },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <HomeIcon className="h-5 w-5 text-brand-600" />
          <CardTitle>2. Confirm the address</CardTitle>
        </div>
        <p className="mb-3 text-sm text-gray-500">
          We extracted this from the listing — adjust if needed. Required for neighborhood scoring.
        </p>
        <Input
          placeholder="123 Main Street, Springfield, IL"
          value={address || extracted?.address || ''}
          onChange={(e) => setAddress(e.target.value)}
        />
      </Card>

      <Card className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-brand-600" />
            <CardTitle>3. Who's the pet?</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={addPet}>
            <Plus className="h-3.5 w-3.5" />
            Add another
          </Button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          Just name and breed is enough — we'll fill in size, activity, and escape risk from the breed.
        </p>

        <div className="space-y-4">
          {pets.map((pet, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pet {i + 1}
                </span>
                {pets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePet(i)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remove pet"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Name"
                  placeholder="Buddy"
                  value={pet.name}
                  onChange={(e) => updatePet(i, { name: e.target.value })}
                />
                <Select
                  label="Species"
                  value={pet.species}
                  onChange={(e) => updatePet(i, { species: e.target.value as QuickPet['species'] })}
                  options={[
                    { value: 'dog', label: 'Dog' },
                    { value: 'cat', label: 'Cat' },
                    { value: 'bird', label: 'Bird' },
                    { value: 'rabbit', label: 'Rabbit' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <div className="relative">
                  <Input
                    label="Breed (optional)"
                    placeholder={pet.species === 'cat' ? 'Maine Coon' : 'Golden Retriever'}
                    value={pet.breed}
                    onChange={(e) => handleBreedChange(i, e.target.value)}
                  />
                  {breedSuggestions[i]?.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {breedSuggestions[i].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => applyBreedDefaults(i, b)}
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {pet.breed && findBreedDefaults(pet.breed) && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-xs text-brand-800">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  <div>
                    <strong>Defaults applied for {pet.breed}:</strong>{' '}
                    {pet.size_category} size, {pet.activity_level.replace('_', ' ')} activity, {pet.escape_risk} escape risk.
                    {findBreedDefaults(pet.breed)?.notes && <span className="block mt-0.5 italic">{findBreedDefaults(pet.breed)?.notes}</span>}
                  </div>
                </div>
              )}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
                  <Edit3 className="mr-1 inline h-3 w-3" />
                  Fine-tune this pet's profile
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Age"
                    value={pet.age_category}
                    onChange={(e) => updatePet(i, { age_category: e.target.value as QuickPet['age_category'] })}
                    options={[
                      { value: 'puppy_kitten', label: 'Puppy / Kitten' },
                      { value: 'young', label: 'Young (1-3)' },
                      { value: 'adult', label: 'Adult (3-7)' },
                      { value: 'senior', label: 'Senior (7+)' },
                    ]}
                  />
                  <Select
                    label="Size"
                    value={pet.size_category}
                    onChange={(e) => updatePet(i, { size_category: e.target.value as QuickPet['size_category'] })}
                    options={[
                      { value: 'tiny', label: 'Tiny' },
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                      { value: 'giant', label: 'Giant' },
                    ]}
                  />
                  <Select
                    label="Activity"
                    value={pet.activity_level}
                    onChange={(e) => updatePet(i, { activity_level: e.target.value as QuickPet['activity_level'] })}
                    options={[
                      { value: 'very_low', label: 'Very low' },
                      { value: 'low', label: 'Low' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'high', label: 'High' },
                      { value: 'very_high', label: 'Very high' },
                    ]}
                  />
                  <Select
                    label="Escape risk"
                    value={pet.escape_risk}
                    onChange={(e) => updatePet(i, { escape_risk: e.target.value as QuickPet['escape_risk'] })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'high', label: 'High' },
                    ]}
                  />
                  <Select
                    label="Indoor / outdoor"
                    value={pet.indoor_outdoor}
                    onChange={(e) => updatePet(i, { indoor_outdoor: e.target.value as QuickPet['indoor_outdoor'] })}
                    options={[
                      { value: 'indoor', label: 'Indoor only' },
                      { value: 'outdoor', label: 'Outdoor mostly' },
                      { value: 'both', label: 'Both' },
                    ]}
                  />
                  <Select
                    label="Anxiety"
                    value={pet.anxiety_sensitivity}
                    onChange={(e) => updatePet(i, { anxiety_sensitivity: e.target.value as QuickPet['anxiety_sensitivity'] })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'high', label: 'High' },
                    ]}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Mobility issues (optional)"
                      placeholder="Hip dysplasia, blind, etc."
                      value={pet.mobility_limitations}
                      onChange={(e) => updatePet(i, { mobility_limitations: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Textarea
                      label="Anything else? (optional)"
                      placeholder="Loves sunbathing, scared of stairs, etc."
                      value={pet.special_notes}
                      onChange={(e) => updatePet(i, { special_notes: e.target.value })}
                    />
                  </div>
                </div>
              </details>
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleScore} loading={scoring} size="lg">
          <Sparkles className="h-4 w-4" />
          Score this property
        </Button>
      </div>
    </div>
  );
}

function Chip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700 ${className}`}>
      {children}
    </span>
  );
}
