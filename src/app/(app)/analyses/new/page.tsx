'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Upload,
  Home,
  PawPrint,
  ClipboardCheck,
  Camera,
  Fence,
  ShowerHead,
  DoorOpen,
  Shield,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Select } from '@/components/ui/input';
import type { PropertyFormData, PetProfileFormData } from '@/lib/validations';
import { isDemoMode } from '@/lib/demo-mode';

const STEPS = ['Property Details', 'Pet Profiles', 'Review & Submit'];

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'other', label: 'Other' },
];

const AGE_OPTIONS = [
  { value: 'puppy_kitten', label: 'Puppy/Kitten' },
  { value: 'young', label: 'Young (1-3 yrs)' },
  { value: 'adult', label: 'Adult (3-7 yrs)' },
  { value: 'senior', label: 'Senior (7+ yrs)' },
];

const SIZE_OPTIONS = [
  { value: 'tiny', label: 'Tiny (< 10 lbs)' },
  { value: 'small', label: 'Small (10-25 lbs)' },
  { value: 'medium', label: 'Medium (25-55 lbs)' },
  { value: 'large', label: 'Large (55-90 lbs)' },
  { value: 'giant', label: 'Giant (90+ lbs)' },
];

const ACTIVITY_OPTIONS = [
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
];

const INDOOR_OUTDOOR_OPTIONS = [
  { value: 'indoor', label: 'Indoor Only' },
  { value: 'outdoor', label: 'Outdoor Mostly' },
  { value: 'both', label: 'Both Indoor & Outdoor' },
];

const ANXIETY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
];

const ESCAPE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'other', label: 'Other' },
];

const FLOORING_OPTIONS = [
  { value: '', label: 'Select flooring...' },
  { value: 'hardwood', label: 'Hardwood' },
  { value: 'lvp', label: 'Luxury Vinyl Plank (LVP)' },
  { value: 'tile', label: 'Tile' },
  { value: 'laminate', label: 'Laminate' },
  { value: 'carpet', label: 'Carpet' },
  { value: 'mixed', label: 'Mixed (multiple types)' },
  { value: 'other', label: 'Other' },
];

const FENCING_OPTIONS = [
  { value: '', label: 'Select fencing...' },
  { value: 'none', label: 'No Fencing' },
  { value: 'partial', label: 'Partial Fencing' },
  { value: 'full', label: 'Fully Fenced' },
  { value: 'privacy', label: 'Privacy Fence (6ft+)' },
  { value: 'chain_link', label: 'Chain Link' },
  { value: 'electric', label: 'Electric/Invisible' },
  { value: 'other', label: 'Other' },
];

const emptyPet: PetProfileFormData = {
  name: '',
  species: 'dog',
  breed: '',
  age_category: 'adult',
  size_category: 'medium',
  activity_level: 'moderate',
  indoor_outdoor: 'both',
  mobility_limitations: '',
  anxiety_sensitivity: 'low',
  escape_risk: 'low',
  special_notes: '',
};

function ToggleChip({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon?: React.ElementType;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
        checked
          ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500/20'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {checked && <Check className="h-3.5 w-3.5 text-brand-600" />}
      {label}
    </button>
  );
}

export default function NewAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [property, setProperty] = useState<PropertyFormData>({
    address: '',
    city: '',
    state: '',
    postal_code: '',
    listing_description: '',
    beds: undefined,
    baths: undefined,
    sqft: undefined,
    lot_size: '',
    property_type: 'single_family',
    stories: undefined,
    flooring_type: undefined,
    fencing_type: undefined,
    has_mudroom: false,
    has_pet_door: false,
    has_pet_wash_station: false,
    has_screened_porch: false,
    has_pool: false,
    has_built_in_pet_features: false,
    built_in_pet_features_desc: '',
    hoa_has_restrictions: undefined,
    hoa_pet_policy: '',
    hoa_breed_restrictions: '',
    hoa_pet_limit: undefined,
    notes: '',
  });

  const [pets, setPets] = useState<PetProfileFormData[]>([{ ...emptyPet }]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [petPhotos, setPetPhotos] = useState<Record<number, File | null>>({});

  function updateProperty(field: keyof PropertyFormData, value: string | number | boolean | undefined) {
    setProperty((prev) => ({ ...prev, [field]: value }));
  }

  function updatePet(index: number, field: keyof PetProfileFormData, value: string) {
    setPets((prev) =>
      prev.map((pet, i) => (i === index ? { ...pet, [field]: value } : pet))
    );
  }

  function addPet() {
    setPets((prev) => [...prev, { ...emptyPet }]);
  }

  function removePet(index: number) {
    if (pets.length <= 1) return;
    setPets((prev) => prev.filter((_, i) => i !== index));
    setPetPhotos((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setPhotos((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function handlePetPhotoUpload(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setPetPhotos((prev) => ({ ...prev, [index]: e.target.files![0] }));
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 1500));
      router.push('/analyses/mock-analysis-1');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('property', JSON.stringify(property));
      formData.append('pets', JSON.stringify(pets));

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      Object.entries(petPhotos).forEach(([index, file]) => {
        if (file) formData.append(`pet_photo_${index}`, file);
      });

      const res = await fetch('/api/analyses', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create analysis');
      }

      const data = await res.json();
      router.push(`/analyses/${data.analysis_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const showHoa = property.property_type === 'condo' || property.property_type === 'townhouse' || property.property_type === 'apartment' || property.hoa_has_restrictions;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New Analysis" description="Evaluate a property for pet suitability" />

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                i === step
                  ? 'bg-brand-600 text-white'
                  : i < step
                    ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {i === 0 && <Home className="h-4 w-4" />}
              {i === 1 && <PawPrint className="h-4 w-4" />}
              {i === 2 && <ClipboardCheck className="h-4 w-4" />}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && <div className="h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Property */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Basic Information</h2>
            <div className="space-y-4">
              <Input
                label="Street Address"
                placeholder="742 Evergreen Terrace"
                value={property.address}
                onChange={(e) => updateProperty('address', e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Input
                  label="City"
                  placeholder="Springfield"
                  value={property.city || ''}
                  onChange={(e) => updateProperty('city', e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="IL"
                  value={property.state || ''}
                  onChange={(e) => updateProperty('state', e.target.value)}
                />
                <Input
                  label="Zip Code"
                  placeholder="62704"
                  value={property.postal_code || ''}
                  onChange={(e) => updateProperty('postal_code', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Property Type"
                  options={PROPERTY_TYPE_OPTIONS}
                  value={property.property_type}
                  onChange={(e) => updateProperty('property_type', e.target.value)}
                />
                <Input
                  label="Stories"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={property.stories ?? ''}
                  onChange={(e) => updateProperty('stories', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Input
                  label="Beds"
                  type="number"
                  min={0}
                  value={property.beds ?? ''}
                  onChange={(e) => updateProperty('beds', e.target.value ? Number(e.target.value) : undefined)}
                />
                <Input
                  label="Baths"
                  type="number"
                  min={0}
                  step={0.5}
                  value={property.baths ?? ''}
                  onChange={(e) => updateProperty('baths', e.target.value ? Number(e.target.value) : undefined)}
                />
                <Input
                  label="Sqft"
                  type="number"
                  min={0}
                  value={property.sqft ?? ''}
                  onChange={(e) => updateProperty('sqft', e.target.value ? Number(e.target.value) : undefined)}
                />
                <Input
                  label="Lot Size"
                  placeholder="0.35 acres"
                  value={property.lot_size || ''}
                  onChange={(e) => updateProperty('lot_size', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Pet-Critical Features */}
          <Card>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Pet-Critical Features</h2>
            <p className="mb-5 text-sm text-gray-500">
              These features heavily influence pet suitability scoring.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Flooring Type"
                  options={FLOORING_OPTIONS}
                  value={property.flooring_type || ''}
                  onChange={(e) => updateProperty('flooring_type', e.target.value || undefined)}
                />
                <Select
                  label="Yard Fencing"
                  options={FENCING_OPTIONS}
                  value={property.fencing_type || ''}
                  onChange={(e) => updateProperty('fencing_type', e.target.value || undefined)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Pet-Friendly Upgrades & Features
                </label>
                <div className="flex flex-wrap gap-2">
                  <ToggleChip
                    label="Mudroom"
                    icon={DoorOpen}
                    checked={property.has_mudroom}
                    onChange={(v) => updateProperty('has_mudroom', v)}
                  />
                  <ToggleChip
                    label="Pet Door"
                    icon={DoorOpen}
                    checked={property.has_pet_door}
                    onChange={(v) => updateProperty('has_pet_door', v)}
                  />
                  <ToggleChip
                    label="Pet Wash Station"
                    icon={ShowerHead}
                    checked={property.has_pet_wash_station}
                    onChange={(v) => updateProperty('has_pet_wash_station', v)}
                  />
                  <ToggleChip
                    label="Screened Porch / Catio"
                    icon={Fence}
                    checked={property.has_screened_porch}
                    onChange={(v) => updateProperty('has_screened_porch', v)}
                  />
                  <ToggleChip
                    label="Pool"
                    checked={property.has_pool}
                    onChange={(v) => updateProperty('has_pool', v)}
                  />
                  <ToggleChip
                    label="Built-in Pet Features"
                    icon={PawPrint}
                    checked={property.has_built_in_pet_features}
                    onChange={(v) => updateProperty('has_built_in_pet_features', v)}
                  />
                </div>
              </div>

              {property.has_built_in_pet_features && (
                <Input
                  label="Describe built-in pet features"
                  placeholder="e.g., Built-in feeding station, under-stair kennel, cat climbing wall..."
                  value={property.built_in_pet_features_desc || ''}
                  onChange={(e) => updateProperty('built_in_pet_features_desc', e.target.value)}
                />
              )}
            </div>
          </Card>

          {/* HOA & Policies */}
          <Card>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">HOA & Pet Policies</h2>
            <p className="mb-5 text-sm text-gray-500">
              HOA restrictions are a top dealbreaker for pet owners — flag them early.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ToggleChip
                  label="Has HOA / Pet Restrictions"
                  icon={Shield}
                  checked={property.hoa_has_restrictions ?? false}
                  onChange={(v) => updateProperty('hoa_has_restrictions', v)}
                />
              </div>

              {showHoa && (
                <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <Textarea
                    label="HOA Pet Policy Details"
                    placeholder="e.g., Max 2 pets allowed. Monthly pet deposit $25. Pets must be leashed in common areas."
                    value={property.hoa_pet_policy || ''}
                    onChange={(e) => updateProperty('hoa_pet_policy', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Breed Restrictions"
                      placeholder="e.g., No pit bulls, rottweilers..."
                      value={property.hoa_breed_restrictions || ''}
                      onChange={(e) => updateProperty('hoa_breed_restrictions', e.target.value)}
                    />
                    <Input
                      label="Pet Limit"
                      type="number"
                      min={0}
                      placeholder="e.g., 2"
                      value={property.hoa_pet_limit ?? ''}
                      onChange={(e) => updateProperty('hoa_pet_limit', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Listing Description & Notes */}
          <Card>
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Description & Notes</h2>
            <div className="space-y-4">
              <Textarea
                label="Listing Description"
                placeholder="Paste the listing description here — the AI analyzes it for pet-relevant keywords like fenced yard, quiet street, single-story, etc."
                value={property.listing_description || ''}
                onChange={(e) => updateProperty('listing_description', e.target.value)}
              />
              <Textarea
                label="Agent Notes (private)"
                placeholder="Your personal observations — e.g., seller says yard is escape-proof, neighbors have barking dogs, street is busier than listing suggests..."
                value={property.notes || ''}
                onChange={(e) => updateProperty('notes', e.target.value)}
              />

              {/* Photo upload */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Listing Photos (optional)
                </label>
                <div className="flex flex-wrap gap-3">
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-0.5 text-white hover:bg-black/70"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500">
                    <Camera className="h-6 w-6" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </label>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => setStep(1)} disabled={!property.address}>
              Next: Pet Profiles
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Pets */}
      {step === 1 && (
        <div className="space-y-6">
          {pets.map((pet, index) => (
            <Card key={index}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pet {index + 1}{pet.name ? `: ${pet.name}` : ''}
                </h2>
                {pets.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removePet(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Pet Name"
                    placeholder="Buddy"
                    value={pet.name}
                    onChange={(e) => updatePet(index, 'name', e.target.value)}
                    required
                  />
                  <Select
                    label="Species"
                    options={SPECIES_OPTIONS}
                    value={pet.species}
                    onChange={(e) => updatePet(index, 'species', e.target.value)}
                  />
                </div>

                {/* Pet photo upload */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Pet Photo (for AI visualization)
                  </label>
                  <div className="flex items-center gap-3">
                    {petPhotos[index] ? (
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-brand-200">
                        <img
                          src={URL.createObjectURL(petPhotos[index]!)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPetPhotos((prev) => ({ ...prev, [index]: null }))}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-brand-400 hover:text-brand-500">
                        <Upload className="h-5 w-5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handlePetPhotoUpload(index, e)}
                        />
                      </label>
                    )}
                    <span className="text-xs text-gray-400">
                      Upload a photo of {pet.name || 'your pet'} to see them in the property
                    </span>
                  </div>
                </div>

                <Input
                  label="Breed"
                  placeholder="Golden Retriever"
                  value={pet.breed || ''}
                  onChange={(e) => updatePet(index, 'breed', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Select
                    label="Age"
                    options={AGE_OPTIONS}
                    value={pet.age_category}
                    onChange={(e) => updatePet(index, 'age_category', e.target.value)}
                  />
                  <Select
                    label="Size"
                    options={SIZE_OPTIONS}
                    value={pet.size_category}
                    onChange={(e) => updatePet(index, 'size_category', e.target.value)}
                  />
                  <Select
                    label="Activity Level"
                    options={ACTIVITY_OPTIONS}
                    value={pet.activity_level}
                    onChange={(e) => updatePet(index, 'activity_level', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Select
                    label="Indoor/Outdoor"
                    options={INDOOR_OUTDOOR_OPTIONS}
                    value={pet.indoor_outdoor}
                    onChange={(e) => updatePet(index, 'indoor_outdoor', e.target.value)}
                  />
                  <Select
                    label="Anxiety Sensitivity"
                    options={ANXIETY_OPTIONS}
                    value={pet.anxiety_sensitivity}
                    onChange={(e) => updatePet(index, 'anxiety_sensitivity', e.target.value)}
                  />
                  <Select
                    label="Escape Risk"
                    options={ESCAPE_OPTIONS}
                    value={pet.escape_risk}
                    onChange={(e) => updatePet(index, 'escape_risk', e.target.value)}
                  />
                </div>
                <Input
                  label="Mobility Limitations"
                  placeholder="e.g., Hip dysplasia, arthritis..."
                  value={pet.mobility_limitations || ''}
                  onChange={(e) => updatePet(index, 'mobility_limitations', e.target.value)}
                />
                <Textarea
                  label="Special Notes"
                  placeholder="Anything else — behavior quirks, dietary needs, specific fears..."
                  value={pet.special_notes || ''}
                  onChange={(e) => updatePet(index, 'special_notes', e.target.value)}
                />
              </div>
            </Card>
          ))}

          <Button variant="outline" onClick={addPet} className="w-full">
            <Plus className="h-4 w-4" />
            Add Another Pet
          </Button>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setStep(2)} disabled={!pets[0]?.name}>
              Review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Property Summary</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-gray-500">Address</dt>
                <dd className="text-gray-900">{property.address}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Type</dt>
                <dd className="text-gray-900 capitalize">{property.property_type.replace('_', ' ')}{property.stories ? ` / ${property.stories} story` : ''}</dd>
              </div>
              {property.beds != null && (
                <div>
                  <dt className="font-medium text-gray-500">Beds / Baths</dt>
                  <dd className="text-gray-900">{property.beds} bed / {property.baths} bath</dd>
                </div>
              )}
              {property.sqft != null && (
                <div>
                  <dt className="font-medium text-gray-500">Size</dt>
                  <dd className="text-gray-900">{property.sqft?.toLocaleString()} sqft{property.lot_size ? ` / ${property.lot_size}` : ''}</dd>
                </div>
              )}
              {property.flooring_type && (
                <div>
                  <dt className="font-medium text-gray-500">Flooring</dt>
                  <dd className="text-gray-900 capitalize">{property.flooring_type === 'lvp' ? 'Luxury Vinyl Plank' : property.flooring_type}</dd>
                </div>
              )}
              {property.fencing_type && (
                <div>
                  <dt className="font-medium text-gray-500">Fencing</dt>
                  <dd className="text-gray-900 capitalize">{property.fencing_type.replace('_', ' ')}</dd>
                </div>
              )}
            </dl>

            {/* Pet features chips */}
            {(property.has_mudroom || property.has_pet_door || property.has_pet_wash_station || property.has_screened_porch || property.has_built_in_pet_features) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {property.has_mudroom && <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">Mudroom</span>}
                {property.has_pet_door && <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">Pet Door</span>}
                {property.has_pet_wash_station && <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">Pet Wash Station</span>}
                {property.has_screened_porch && <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">Screened Porch</span>}
                {property.has_built_in_pet_features && <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-medium text-sage-700">Built-in Pet Features</span>}
              </div>
            )}

            {property.hoa_has_restrictions && (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <strong>HOA:</strong> {property.hoa_pet_policy || 'Restrictions noted'}{property.hoa_breed_restrictions ? ` | Breed restrictions: ${property.hoa_breed_restrictions}` : ''}{property.hoa_pet_limit ? ` | Pet limit: ${property.hoa_pet_limit}` : ''}
              </div>
            )}

            {property.listing_description && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-3">{property.listing_description}</p>
            )}
            {photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {photos.map((photo, i) => (
                  <div key={i} className="h-16 w-16 overflow-hidden rounded-lg border">
                    <img src={URL.createObjectURL(photo)} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Pet{pets.length > 1 ? 's' : ''} ({pets.length})
            </h2>
            <div className="space-y-3">
              {pets.map((pet, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg bg-gray-50 p-3">
                  {petPhotos[i] ? (
                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-brand-200">
                      <img src={URL.createObjectURL(petPhotos[i]!)} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
                      <PawPrint className="h-6 w-6 text-brand-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{pet.name}</p>
                    <p className="text-sm text-gray-500">
                      {pet.breed || pet.species} &middot; {pet.age_category} &middot;{' '}
                      {pet.size_category} &middot; {pet.activity_level} activity
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Run Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
