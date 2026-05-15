export interface Property {
  id: string;
  user_id: string;
  address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  listing_description: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  lot_size: string | null;
  property_type: string;
  stories: number | null;
  flooring_type: FlooringType | null;
  fencing_type: FencingType | null;
  has_mudroom: boolean;
  has_pet_door: boolean;
  has_pet_wash_station: boolean;
  has_screened_porch: boolean;
  has_pool: boolean;
  has_built_in_pet_features: boolean;
  built_in_pet_features_desc: string | null;
  hoa_has_restrictions: boolean | null;
  hoa_pet_policy: string | null;
  hoa_breed_restrictions: string | null;
  hoa_pet_limit: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type FlooringType =
  | 'hardwood'
  | 'lvp'
  | 'tile'
  | 'laminate'
  | 'carpet'
  | 'mixed'
  | 'other';

export type FencingType =
  | 'none'
  | 'partial'
  | 'full'
  | 'privacy'
  | 'chain_link'
  | 'electric'
  | 'other';

export interface PetProfile {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string | null;
  age_category: 'puppy_kitten' | 'young' | 'adult' | 'senior';
  size_category: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
  activity_level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  indoor_outdoor: 'indoor' | 'outdoor' | 'both';
  mobility_limitations: string | null;
  anxiety_sensitivity: 'low' | 'moderate' | 'high';
  escape_risk: 'low' | 'moderate' | 'high';
  special_notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  property_id: string;
  user_id: string;
  overall_score: number | null;
  traffic_safety_score: number | null;
  yard_score: number | null;
  senior_comfort_score: number | null;
  exercise_score: number | null;
  indoor_comfort_score: number | null;
  noise_stress_score: number | null;
  red_flags_json: string[];
  highlights_json: string[];
  ai_summary: string | null;
  agent_notes: string | null;
  scoring_details_json: ScoringDetails;
  species_insights_json: SpeciesInsights | null;
  marketing_tips_json: string[] | null;
  upgrade_suggestions_json: UpgradeSuggestion[] | null;
  map_context_json: MapContext | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisPhoto {
  id: string;
  property_id: string;
  user_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  default_branding_name: string;
  created_at: string;
  updated_at: string;
}

export interface SavedPet {
  id: string;
  user_id: string;
  client_name: string | null;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string | null;
  age_category: 'puppy_kitten' | 'young' | 'adult' | 'senior';
  size_category: 'tiny' | 'small' | 'medium' | 'large' | 'giant';
  activity_level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
  indoor_outdoor: 'indoor' | 'outdoor' | 'both';
  mobility_limitations: string | null;
  anxiety_sensitivity: 'low' | 'moderate' | 'high';
  escape_risk: 'low' | 'moderate' | 'high';
  special_notes: string | null;
  photo_url: string | null;
  last_used_at: string;
  created_at: string;
  updated_at: string;
}

export interface ScoreDetail {
  score: number;
  reasoning: string;
}

export interface ScoringDetails {
  traffic_safety?: ScoreDetail;
  yard?: ScoreDetail;
  senior_comfort?: ScoreDetail;
  exercise?: ScoreDetail;
  indoor_comfort?: ScoreDetail;
  noise_stress?: ScoreDetail;
}

export interface SpeciesInsight {
  strengths: string[];
  concerns: string[];
  must_haves_met: string[];
  must_haves_missing: string[];
  dealbreaker_risk: 'low' | 'moderate' | 'high';
}

export interface SpeciesInsights {
  dog?: SpeciesInsight;
  cat?: SpeciesInsight;
  [key: string]: SpeciesInsight | undefined;
}

export interface UpgradeSuggestion {
  name: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  estimated_cost?: string;
}

export interface MapContext {
  geocoded_address?: string;
  latitude?: number;
  longitude?: number;
  nearby_parks: PlaceResult[];
  nearby_highways: PlaceResult[];
  nearby_vets: PlaceResult[];
  nearby_pet_stores: PlaceResult[];
  nearby_groomers: PlaceResult[];
  nearby_trails: PlaceResult[];
  walkability_estimate?: number;
  road_risk_level?: 'low' | 'moderate' | 'high';
  road_risk_notes?: string;
  summary: string;
}

export interface PlaceResult {
  name: string;
  distance_meters?: number;
  type?: string;
  rating?: number;
}

export interface AnalysisResult {
  overall_score: number;
  traffic_safety_score: number;
  yard_score: number;
  senior_comfort_score: number;
  exercise_score: number;
  indoor_comfort_score: number;
  noise_stress_score: number;
  red_flags: string[];
  highlights: string[];
  ai_summary: string;
  agent_notes: string;
  scoring_details: ScoringDetails;
  species_insights: SpeciesInsights;
  marketing_tips: string[];
  upgrade_suggestions: UpgradeSuggestion[];
}

export interface PropertyWithRelations extends Property {
  pet_profiles: PetProfile[];
  analyses: Analysis[];
  analysis_photos: AnalysisPhoto[];
}

export interface VisualizationScene {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string | null;
  loading: boolean;
}
