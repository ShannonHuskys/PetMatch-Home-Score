import { z } from 'zod';

export const propertySchema = z.object({
  address: z.string().min(5, 'Address is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  listing_description: z.string().optional(),
  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().min(0).optional(),
  sqft: z.coerce.number().int().min(0).optional(),
  lot_size: z.string().optional(),
  property_type: z
    .enum(['single_family', 'condo', 'townhouse', 'apartment', 'multi_family', 'other'])
    .default('single_family'),
  stories: z.coerce.number().int().min(1).optional(),
  flooring_type: z
    .enum(['hardwood', 'lvp', 'tile', 'laminate', 'carpet', 'mixed', 'other'])
    .optional(),
  fencing_type: z
    .enum(['none', 'partial', 'full', 'privacy', 'chain_link', 'electric', 'other'])
    .optional(),
  has_mudroom: z.boolean().default(false),
  has_pet_door: z.boolean().default(false),
  has_pet_wash_station: z.boolean().default(false),
  has_screened_porch: z.boolean().default(false),
  has_pool: z.boolean().default(false),
  has_built_in_pet_features: z.boolean().default(false),
  built_in_pet_features_desc: z.string().optional(),
  hoa_has_restrictions: z.boolean().optional(),
  hoa_pet_policy: z.string().optional(),
  hoa_breed_restrictions: z.string().optional(),
  hoa_pet_limit: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const petProfileSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']).default('dog'),
  breed: z.string().optional(),
  age_category: z
    .enum(['puppy_kitten', 'young', 'adult', 'senior'])
    .default('adult'),
  size_category: z
    .enum(['tiny', 'small', 'medium', 'large', 'giant'])
    .default('medium'),
  activity_level: z
    .enum(['very_low', 'low', 'moderate', 'high', 'very_high'])
    .default('moderate'),
  indoor_outdoor: z.enum(['indoor', 'outdoor', 'both']).default('both'),
  mobility_limitations: z.string().optional(),
  anxiety_sensitivity: z.enum(['low', 'moderate', 'high']).default('low'),
  escape_risk: z.enum(['low', 'moderate', 'high']).default('low'),
  special_notes: z.string().optional(),
});

export const analysisFormSchema = z.object({
  property: propertySchema,
  pets: z.array(petProfileSchema).min(1, 'At least one pet is required'),
});

export const settingsSchema = z.object({
  default_branding_name: z
    .string()
    .min(1, 'Branding name is required')
    .max(100),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
export type PetProfileFormData = z.infer<typeof petProfileSchema>;
export type AnalysisFormData = z.infer<typeof analysisFormSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
