import OpenAI from 'openai';
import type { Property, PetProfile, VisualizationScene } from '@/types/database';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface SceneTemplate {
  id: string;
  title: string;
  location: string;
  promptBuilder: (pet: PetProfile, property: Property) => string;
}

function getSceneTemplates(property: Property): SceneTemplate[] {
  const desc = (property.listing_description || '').toLowerCase();
  const scenes: SceneTemplate[] = [];

  const hasYard = desc.includes('yard') || desc.includes('backyard') || desc.includes('garden');
  const hasSunroom = desc.includes('sunroom') || desc.includes('sun room');
  const hasWindows = desc.includes('window') || desc.includes('floor-to-ceiling');

  scenes.push({
    id: 'living-room',
    title: 'Relaxing Inside',
    location: 'Living Room',
    promptBuilder: (pet) =>
      `A photorealistic image of a ${pet.age_category} ${pet.breed || pet.species} named ${pet.name} relaxing comfortably in a modern, well-lit living room. The room has warm tones, a cozy couch, and natural light streaming in. The ${pet.species} looks happy and content. Professional real estate photography style, warm and inviting.`,
  });

  if (hasYard) {
    scenes.push({
      id: 'backyard',
      title: 'Playing in the Yard',
      location: 'Backyard',
      promptBuilder: (pet) =>
        `A photorealistic image of a ${pet.age_category} ${pet.breed || pet.species} named ${pet.name} ${pet.activity_level === 'high' || pet.activity_level === 'very_high' ? 'running and playing' : 'resting peacefully'} in a beautiful fenced backyard with green grass and shade trees. Sunny day, the ${pet.species} looks joyful. Professional real estate photography style.`,
    });
  }

  if (hasSunroom || hasWindows) {
    scenes.push({
      id: 'sunroom',
      title: 'Sunbathing Spot',
      location: hasSunroom ? 'Sunroom' : 'Window Seat',
      promptBuilder: (pet) =>
        `A photorealistic image of a ${pet.age_category} ${pet.breed || pet.species} named ${pet.name} lounging in a warm sunbeam in a beautiful ${hasSunroom ? 'sunroom with panoramic windows' : 'room with large windows'}. The light is golden and warm. The ${pet.species} looks perfectly content and peaceful. Professional interior photography style.`,
    });
  }

  scenes.push({
    id: 'neighborhood-walk',
    title: 'Neighborhood Stroll',
    location: 'Nearby Park',
    promptBuilder: (pet) =>
      `A photorealistic image of a ${pet.age_category} ${pet.breed || pet.species} named ${pet.name} on a pleasant walk through a tree-lined neighborhood park. Green grass, walking path, blue sky. The ${pet.species} is on a leash, looking happy and alert. Warm, friendly atmosphere. Professional lifestyle photography.`,
  });

  scenes.push({
    id: 'front-porch',
    title: 'Watching the World',
    location: 'Front Porch',
    promptBuilder: (pet) =>
      `A photorealistic image of a ${pet.age_category} ${pet.breed || pet.species} named ${pet.name} sitting contentedly on a charming front porch of a ${property.property_type === 'condo' ? 'modern building entrance' : 'suburban home'}. The ${pet.species} is observing the quiet street. Warm golden hour lighting. Professional lifestyle photography.`,
  });

  return scenes;
}

export function getAvailableScenes(
  property: Property,
  pet: PetProfile
): VisualizationScene[] {
  return getSceneTemplates(property).map((scene) => ({
    id: `${pet.id}-${scene.id}`,
    title: scene.title,
    description: `${pet.name} in the ${scene.location}`,
    location: scene.location,
    image_url: null,
    loading: false,
  }));
}

export async function generateSceneImage(
  property: Property,
  pet: PetProfile,
  sceneId: string
): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const templates = getSceneTemplates(property);
  const baseSceneId = sceneId.replace(`${pet.id}-`, '');
  const template = templates.find((t) => t.id === baseSceneId);

  if (!template) return null;

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const prompt = template.promptBuilder(pet, property);

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data?.[0]?.url || null;
  } catch (error) {
    console.error('Image generation failed:', error);
    return null;
  }
}
