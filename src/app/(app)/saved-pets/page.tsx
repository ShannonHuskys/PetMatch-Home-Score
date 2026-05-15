'use client';

import { useEffect, useState } from 'react';
import { Dog, Cat, PawPrint, Trash2, Plus, Users, Edit3, X, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { isDemoMode } from '@/lib/demo-mode';
import { MOCK_SAVED_PETS } from '@/lib/mock-data';
import { findBreedDefaults } from '@/lib/breed-defaults';
import type { SavedPet } from '@/types/database';

type EditableSavedPet = Partial<SavedPet> & { id?: string };

function emptyPet(): EditableSavedPet {
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
    client_name: '',
    mobility_limitations: '',
    special_notes: '',
  };
}

export default function SavedPetsPage() {
  const [pets, setPets] = useState<SavedPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<EditableSavedPet>(emptyPet());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    if (isDemoMode) {
      setPets(MOCK_SAVED_PETS);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/saved-pets');
      if (!res.ok) throw new Error('Failed to load saved pets');
      const { pets: data } = await res.json();
      setPets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setDraft(emptyPet());
    setEditingId('new');
  }

  function startEdit(pet: SavedPet) {
    setDraft({ ...pet });
    setEditingId(pet.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyPet());
  }

  function applyBreedDefaults(breed: string) {
    const defaults = findBreedDefaults(breed);
    if (!defaults) {
      setDraft((d) => ({ ...d, breed }));
      return;
    }
    setDraft((d) => ({
      ...d,
      breed,
      species: defaults.species,
      size_category: defaults.size,
      activity_level: defaults.activity,
      escape_risk: defaults.escape_risk,
      anxiety_sensitivity: defaults.anxiety,
      special_notes: defaults.notes || d.special_notes,
    }));
  }

  async function saveDraft() {
    if (!draft.name?.trim()) {
      setError('Pet name is required.');
      return;
    }
    setSaving(true);
    setError(null);

    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 500));
      if (editingId === 'new') {
        const newPet: SavedPet = {
          id: `mock-${Date.now()}`,
          user_id: 'mock-user',
          client_name: draft.client_name || null,
          name: draft.name!,
          species: draft.species || 'dog',
          breed: draft.breed || null,
          age_category: draft.age_category || 'adult',
          size_category: draft.size_category || 'medium',
          activity_level: draft.activity_level || 'moderate',
          indoor_outdoor: draft.indoor_outdoor || 'both',
          mobility_limitations: draft.mobility_limitations || null,
          anxiety_sensitivity: draft.anxiety_sensitivity || 'low',
          escape_risk: draft.escape_risk || 'low',
          special_notes: draft.special_notes || null,
          photo_url: null,
          last_used_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setPets((p) => [newPet, ...p]);
      } else {
        setPets((p) => p.map((x) => (x.id === editingId ? { ...x, ...draft } as SavedPet : x)));
      }
      cancelEdit();
      setSaving(false);
      return;
    }

    try {
      if (editingId === 'new') {
        const res = await fetch('/api/saved-pets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_name: draft.client_name || null,
            name: draft.name,
            species: draft.species || 'dog',
            breed: draft.breed || null,
            age_category: draft.age_category || 'adult',
            size_category: draft.size_category || 'medium',
            activity_level: draft.activity_level || 'moderate',
            indoor_outdoor: draft.indoor_outdoor || 'both',
            mobility_limitations: draft.mobility_limitations || null,
            anxiety_sensitivity: draft.anxiety_sensitivity || 'low',
            escape_risk: draft.escape_risk || 'low',
            special_notes: draft.special_notes || null,
          }),
        });
        if (!res.ok) throw new Error('Failed to save');
      } else {
        const res = await fetch(`/api/saved-pets/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
        if (!res.ok) throw new Error('Failed to update');
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function deletePet(id: string) {
    if (!confirm('Remove this saved pet?')) return;
    if (isDemoMode) {
      setPets((p) => p.filter((x) => x.id !== id));
      return;
    }
    try {
      const res = await fetch(`/api/saved-pets/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  // Group by client
  const groups = pets.reduce<Record<string, SavedPet[]>>((acc, p) => {
    const key = p.client_name?.trim() || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const groupOrder = Object.keys(groups).sort((a, b) => (a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b)));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Saved Pets"
        description="Your client pet profiles. Pick them from Quick Analyze to save time."
        action={
          <Button onClick={startNew} disabled={editingId !== null}>
            <Plus className="h-4 w-4" />
            Add saved pet
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {editingId !== null && (
        <Card className="mb-6 border-brand-200">
          <CardTitle className="mb-4">
            {editingId === 'new' ? 'New saved pet' : 'Edit saved pet'}
          </CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Pet name"
              placeholder="Buddy"
              value={draft.name || ''}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
            <Input
              label="Client (optional)"
              placeholder="Smith family"
              value={draft.client_name || ''}
              onChange={(e) => setDraft({ ...draft, client_name: e.target.value })}
            />
            <Select
              label="Species"
              value={draft.species || 'dog'}
              onChange={(e) => setDraft({ ...draft, species: e.target.value as SavedPet['species'] })}
              options={[
                { value: 'dog', label: 'Dog' },
                { value: 'cat', label: 'Cat' },
                { value: 'bird', label: 'Bird' },
                { value: 'rabbit', label: 'Rabbit' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              label="Breed"
              placeholder="Golden Retriever"
              value={draft.breed || ''}
              onChange={(e) => applyBreedDefaults(e.target.value)}
            />
            <Select
              label="Age"
              value={draft.age_category || 'adult'}
              onChange={(e) => setDraft({ ...draft, age_category: e.target.value as SavedPet['age_category'] })}
              options={[
                { value: 'puppy_kitten', label: 'Puppy / Kitten' },
                { value: 'young', label: 'Young' },
                { value: 'adult', label: 'Adult' },
                { value: 'senior', label: 'Senior' },
              ]}
            />
            <Select
              label="Size"
              value={draft.size_category || 'medium'}
              onChange={(e) => setDraft({ ...draft, size_category: e.target.value as SavedPet['size_category'] })}
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
              value={draft.activity_level || 'moderate'}
              onChange={(e) => setDraft({ ...draft, activity_level: e.target.value as SavedPet['activity_level'] })}
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
              value={draft.escape_risk || 'low'}
              onChange={(e) => setDraft({ ...draft, escape_risk: e.target.value as SavedPet['escape_risk'] })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'high', label: 'High' },
              ]}
            />
            <Select
              label="Indoor / outdoor"
              value={draft.indoor_outdoor || 'both'}
              onChange={(e) => setDraft({ ...draft, indoor_outdoor: e.target.value as SavedPet['indoor_outdoor'] })}
              options={[
                { value: 'indoor', label: 'Indoor only' },
                { value: 'outdoor', label: 'Outdoor mostly' },
                { value: 'both', label: 'Both' },
              ]}
            />
            <Select
              label="Anxiety"
              value={draft.anxiety_sensitivity || 'low'}
              onChange={(e) => setDraft({ ...draft, anxiety_sensitivity: e.target.value as SavedPet['anxiety_sensitivity'] })}
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
                value={draft.mobility_limitations || ''}
                onChange={(e) => setDraft({ ...draft, mobility_limitations: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Notes (optional)"
                placeholder="Loves sunbathing, scared of stairs, etc."
                value={draft.special_notes || ''}
                onChange={(e) => setDraft({ ...draft, special_notes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={cancelEdit}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={saveDraft} loading={saving}>
              <Check className="h-4 w-4" />
              {editingId === 'new' ? 'Save pet' : 'Update'}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card>
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-1/3 rounded bg-gray-200" />
            <div className="h-12 rounded bg-gray-100" />
            <div className="h-12 rounded bg-gray-100" />
          </div>
        </Card>
      ) : pets.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title="No saved pets yet"
          description="Save your clients' pets once, then pick them with one click on every new analysis."
        >
          <Button onClick={startNew}>
            <Plus className="h-4 w-4" />
            Add your first
          </Button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {groupOrder.map((groupName) => (
            <div key={groupName}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                <Users className="h-4 w-4" />
                {groupName}
                <span className="ml-1 text-xs font-normal normal-case text-gray-400">
                  ({groups[groupName].length})
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {groups[groupName].map((pet) => {
                  const Icon = pet.species === 'dog' ? Dog : pet.species === 'cat' ? Cat : PawPrint;
                  return (
                    <Card key={pet.id} padding="sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(pet)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                aria-label="Edit"
                                disabled={editingId !== null}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePet(pet.id)}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                aria-label="Delete"
                                disabled={editingId !== null}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {pet.breed || 'Unknown breed'} · {pet.age_category} · {pet.size_category}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                              {pet.activity_level.replace('_', ' ')} activity
                            </span>
                            {pet.escape_risk !== 'low' && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                                {pet.escape_risk} escape risk
                              </span>
                            )}
                            {pet.anxiety_sensitivity === 'high' && (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                                high anxiety
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
