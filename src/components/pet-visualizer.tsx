'use client';

import { useState } from 'react';
import { Sparkles, ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PetProfile, VisualizationScene } from '@/types/database';

interface PetVisualizerProps {
  analysisId: string;
  pets: PetProfile[];
  scenes: VisualizationScene[];
}

export function PetVisualizer({ analysisId, pets, scenes: initialScenes }: PetVisualizerProps) {
  const [selectedPet, setSelectedPet] = useState<PetProfile>(pets[0]);
  const [scenes, setScenes] = useState<VisualizationScene[]>(initialScenes);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const petScenes = scenes.filter((s) => s.id.startsWith(selectedPet.id));

  async function generateScene(sceneId: string) {
    setGeneratingId(sceneId);
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, loading: true } : s))
    );

    try {
      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: analysisId, pet_id: selectedPet.id, scene_id: sceneId }),
      });

      if (res.ok) {
        const data = await res.json();
        setScenes((prev) =>
          prev.map((s) =>
            s.id === sceneId ? { ...s, image_url: data.image_url, loading: false } : s
          )
        );
      } else {
        setScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? { ...s, loading: false } : s))
        );
      }
    } catch {
      setScenes((prev) =>
        prev.map((s) => (s.id === sceneId ? { ...s, loading: false } : s))
      );
    }

    setGeneratingId(null);
  }

  if (pets.length === 0) return null;

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <CardTitle>See Your Pet Here</CardTitle>
      </div>
      <p className="mb-4 text-sm text-gray-500">
        AI-generated visualizations of your pet in different areas of the property. These are
        illustrative — powered by DALL-E.
      </p>

      {pets.length > 1 && (
        <div className="mb-4 flex gap-2">
          {pets.map((pet) => (
            <button
              key={pet.id}
              onClick={() => setSelectedPet(pet)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedPet.id === pet.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pet.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {petScenes.map((scene) => (
          <div
            key={scene.id}
            className="overflow-hidden rounded-xl border border-gray-200"
          >
            {scene.image_url ? (
              <div className="relative aspect-square">
                <img
                  src={scene.image_url}
                  alt={scene.description}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                {scene.loading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                    <p className="text-sm text-gray-500">Creating scene...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 px-4 text-center">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateScene(scene.id)}
                      disabled={generatingId !== null}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="bg-white px-3 py-2">
              <p className="text-sm font-medium text-gray-900">{scene.title}</p>
              <p className="text-xs text-gray-500">{scene.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
