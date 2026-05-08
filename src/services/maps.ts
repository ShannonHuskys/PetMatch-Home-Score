import type { MapContext, PlaceResult } from '@/types/database';

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;
const BASE_URL = 'https://maps.googleapis.com/maps/api';

interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address: string;
}

async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!GOOGLE_MAPS_KEY) return null;

  const url = `${BASE_URL}/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) return null;

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    formatted_address: result.formatted_address,
  };
}

async function searchNearby(
  lat: number,
  lng: number,
  type: string,
  keyword?: string,
  radius = 2000
): Promise<PlaceResult[]> {
  if (!GOOGLE_MAPS_KEY) return [];

  let url = `${BASE_URL}/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_KEY}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK') return [];

  return (data.results || []).slice(0, 5).map((place: Record<string, unknown>) => ({
    name: place.name as string,
    type: type,
    rating: place.rating as number | undefined,
    distance_meters: estimateDistance(
      lat,
      lng,
      (place.geometry as Record<string, Record<string, number>>)?.location?.lat,
      (place.geometry as Record<string, Record<string, number>>)?.location?.lng
    ),
  }));
}

function estimateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateRoadRisk(
  nearby_highways: PlaceResult[]
): { level: 'low' | 'moderate' | 'high'; notes: string } {
  const closeHighways = nearby_highways.filter(
    (h) => h.distance_meters && h.distance_meters < 500
  );

  if (closeHighways.length >= 2) {
    return {
      level: 'high',
      notes: `${closeHighways.length} major roads within 500m. Significant traffic risk for outdoor pets.`,
    };
  }
  if (closeHighways.length === 1) {
    return {
      level: 'moderate',
      notes: 'One major road nearby. Leash walking recommended. Fenced yard important.',
    };
  }
  return {
    level: 'low',
    notes: 'No major highways detected nearby. Lower traffic risk for outdoor pets.',
  };
}

export async function buildMapContext(address: string): Promise<MapContext> {
  const geocoded = await geocodeAddress(address);

  if (!geocoded) {
    return getMockMapContext(address);
  }

  const { lat, lng, formatted_address } = geocoded;

  const [parks, highways, vets, petStores, groomers, trails] = await Promise.all([
    searchNearby(lat, lng, 'park'),
    searchNearby(lat, lng, 'route', 'highway interstate freeway', 3000),
    searchNearby(lat, lng, 'veterinary_care'),
    searchNearby(lat, lng, 'pet_store'),
    searchNearby(lat, lng, 'point_of_interest', 'pet groomer grooming'),
    searchNearby(lat, lng, 'park', 'trail hiking walking path', 3000),
  ]);

  const roadRisk = estimateRoadRisk(highways);

  const walkabilityEstimate = Math.min(
    100,
    Math.max(
      20,
      40 +
        parks.length * 10 +
        petStores.length * 5 -
        highways.filter((h) => h.distance_meters && h.distance_meters < 1000).length * 15
    )
  );

  const summaryParts: string[] = [];
  summaryParts.push(`Address: ${formatted_address}`);
  summaryParts.push(`Parks within 2km: ${parks.length} (${parks.map((p) => p.name).join(', ') || 'none found'})`);
  summaryParts.push(`Road risk: ${roadRisk.level} — ${roadRisk.notes}`);
  summaryParts.push(`Nearby vets: ${vets.length}`);
  summaryParts.push(`Nearby groomers: ${groomers.length}`);
  summaryParts.push(`Nearby trails: ${trails.length}`);
  summaryParts.push(`Walkability estimate: ${walkabilityEstimate}/100`);

  return {
    geocoded_address: formatted_address,
    latitude: lat,
    longitude: lng,
    nearby_parks: parks,
    nearby_highways: highways,
    nearby_vets: vets,
    nearby_pet_stores: petStores,
    nearby_groomers: groomers,
    nearby_trails: trails,
    walkability_estimate: walkabilityEstimate,
    road_risk_level: roadRisk.level,
    road_risk_notes: roadRisk.notes,
    summary: summaryParts.join('\n'),
  };
}

function getMockMapContext(address: string): MapContext {
  return {
    geocoded_address: address,
    latitude: 39.7817,
    longitude: -89.6501,
    nearby_parks: [
      { name: 'Centennial Park', distance_meters: 800, type: 'park', rating: 4.3 },
      { name: 'Lincoln Memorial Garden', distance_meters: 1500, type: 'park', rating: 4.6 },
    ],
    nearby_highways: [
      { name: 'Interstate 55', distance_meters: 2200, type: 'route' },
    ],
    nearby_vets: [
      { name: 'Springfield Animal Hospital', distance_meters: 1200, type: 'veterinary_care', rating: 4.5 },
    ],
    nearby_pet_stores: [
      { name: 'PetSmart', distance_meters: 1800, type: 'pet_store', rating: 4.1 },
    ],
    nearby_groomers: [
      { name: 'Pawfect Grooming', distance_meters: 1400, type: 'groomer', rating: 4.7 },
    ],
    nearby_trails: [
      { name: 'Centennial Park Trail', distance_meters: 900, type: 'trail', rating: 4.4 },
    ],
    walkability_estimate: 65,
    road_risk_level: 'low',
    road_risk_notes: 'No major highways within close proximity. (Mock data — configure Google Maps API for real results.)',
    summary: `Address: ${address}\nParks within 2km: 2 (Centennial Park, Lincoln Memorial Garden)\nRoad risk: low — No major highways within close proximity\nNearby vets: 1\nWalkability estimate: 65/100\n(Mock data — configure GOOGLE_MAPS_API_KEY for real geospatial results)`,
  };
}
