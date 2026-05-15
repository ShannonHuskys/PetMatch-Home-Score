'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  PawPrint,
  ArrowLeft,
  Dog,
  Cat,
  TrendingUp,
  Megaphone,
  Wrench,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScoreRing, ScoreBadge } from '@/components/ui/score-ring';
import { PetVisualizer } from '@/components/pet-visualizer';
import { getAvailableScenes } from '@/services/pet-visualizer';
import { isDemoMode } from '@/lib/demo-mode';
import type { Analysis, Property, PetProfile, AnalysisPhoto, VisualizationScene, SpeciesInsight, UpgradeSuggestion } from '@/types/database';

interface Props {
  analysis: Analysis;
  property: Property;
  pets: PetProfile[];
  photos: AnalysisPhoto[];
}

export function AnalysisDetailClient({ analysis, property, pets, photos }: Props) {
  const router = useRouter();
  const [rerunning, setRerunning] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  const allScenes: VisualizationScene[] = pets.flatMap((pet) =>
    getAvailableScenes(property, pet)
  );

  async function handleRerun() {
    if (isDemoMode) {
      setRerunError('Re-run is not available in demo mode. Connect Supabase to enable.');
      return;
    }
    setRerunning(true);
    setRerunError(null);
    try {
      const res = await fetch(`/api/analyses/${analysis.id}/rerun`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        setRerunError('Failed to re-run analysis. Please try again.');
      }
    } catch {
      setRerunError('Network error. Please check your connection.');
    } finally {
      setRerunning(false);
    }
  }

  const redFlags = Array.isArray(analysis.red_flags_json) ? analysis.red_flags_json : [];
  const highlights = Array.isArray(analysis.highlights_json) ? analysis.highlights_json : [];
  const details = analysis.scoring_details_json || {};
  const speciesInsights = analysis.species_insights_json || {};
  const marketingTips = analysis.marketing_tips_json || [];
  const upgradeSuggestions = analysis.upgrade_suggestions_json || [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <PageHeader
        title={property.address}
        description={[property.city, property.state, property.postal_code].filter(Boolean).join(', ')}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRerun} loading={rerunning}>
              <RefreshCw className="h-4 w-4" />
              Re-run
            </Button>
            <Link href={`/analyses/${analysis.id}/print`}>
              <Button variant="outline">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </Link>
          </div>
        }
      />

      {rerunError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {rerunError}
        </div>
      )}

      {/* Overall Score */}
      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
          <ScoreRing score={analysis.overall_score || 0} size="lg" label="Overall Score" />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900">Pet Suitability Score</h2>
            <p className="mt-1 text-sm text-gray-500">
              Based on property features, neighborhood data, and{' '}
              {pets.length} pet profile{pets.length !== 1 ? 's' : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {pets.map((pet) => (
                <span
                  key={pet.id}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                >
                  <PawPrint className="h-3 w-3" />
                  {pet.name} ({pet.breed || pet.species})
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Sub-scores */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {analysis.traffic_safety_score != null && (
          <ScoreBadge score={analysis.traffic_safety_score} label="Traffic Safety" />
        )}
        {analysis.yard_score != null && (
          <ScoreBadge score={analysis.yard_score} label="Yard Suitability" />
        )}
        {analysis.senior_comfort_score != null && (
          <ScoreBadge score={analysis.senior_comfort_score} label="Senior Comfort" />
        )}
        {analysis.exercise_score != null && (
          <ScoreBadge score={analysis.exercise_score} label="Exercise Friendliness" />
        )}
        {analysis.indoor_comfort_score != null && (
          <ScoreBadge score={analysis.indoor_comfort_score} label="Indoor Comfort" />
        )}
        {analysis.noise_stress_score != null && (
          <ScoreBadge score={analysis.noise_stress_score} label="Noise & Stress" />
        )}
      </div>

      {/* Score explanations */}
      {Object.keys(details).length > 0 && (
        <Card className="mb-6">
          <CardTitle className="mb-4">Score Breakdown</CardTitle>
          <div className="space-y-3">
            {Object.entries(details).map(([key, detail]) => {
              if (!detail) return null;
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={key} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <span className="text-sm font-bold text-brand-600">{detail.score}/100</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{detail.reasoning}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Pet Visualizer */}
      {pets.length > 0 && (
        <div className="mb-6">
          <PetVisualizer analysisId={analysis.id} pets={pets} scenes={allScenes} />
        </div>
      )}

      {/* Species-Specific Insights */}
      {Object.keys(speciesInsights).length > 0 && (
        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          {Object.entries(speciesInsights).map(([species, insight]) => {
            if (!insight) return null;
            const si = insight as SpeciesInsight;
            const SpeciesIcon = species === 'dog' ? Dog : species === 'cat' ? Cat : PawPrint;
            const riskColors = { low: 'text-green-600 bg-green-50', moderate: 'text-amber-600 bg-amber-50', high: 'text-red-600 bg-red-50' };
            return (
              <Card key={species}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SpeciesIcon className="h-5 w-5 text-brand-600" />
                    <CardTitle className="capitalize">{species} Owner Insights</CardTitle>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskColors[si.dealbreaker_risk]}`}>
                    {si.dealbreaker_risk === 'low' ? 'Low Risk' : si.dealbreaker_risk === 'moderate' ? 'Some Risk' : 'Dealbreaker Risk'}
                  </span>
                </div>
                {si.must_haves_met.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600">Must-Haves Met</p>
                    <ul className="space-y-1">
                      {si.must_haves_met.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {si.must_haves_missing.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">Must-Haves Missing</p>
                    <ul className="space-y-1">
                      {si.must_haves_missing.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {si.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Strengths</p>
                    <ul className="space-y-1">
                      {si.strengths.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {si.concerns.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Concerns</p>
                    <ul className="space-y-1">
                      {si.concerns.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Red Flags & Highlights */}
      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        {redFlags.length > 0 && (
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Red Flags</CardTitle>
            </div>
            <ul className="space-y-2">
              {redFlags.map((flag: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  {flag}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {highlights.length > 0 && (
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <CardTitle>Highlights</CardTitle>
            </div>
            <ul className="space-y-2">
              {highlights.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Summary */}
      {analysis.ai_summary && (
        <Card className="mb-6">
          <CardTitle className="mb-3">Summary for Buyer</CardTitle>
          <p className="text-sm leading-relaxed text-gray-700">{analysis.ai_summary}</p>
        </Card>
      )}

      {/* Agent Notes */}
      {analysis.agent_notes && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-brand-600" />
            <CardTitle>Agent Notes (Private)</CardTitle>
          </div>
          <p className="text-sm leading-relaxed text-gray-700">{analysis.agent_notes}</p>
        </Card>
      )}

      {/* Marketing Tips */}
      {marketingTips.length > 0 && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-brand-600" />
            <CardTitle>Marketing Tips (Private)</CardTitle>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            How to position this listing for pet-owning buyers.
          </p>
          <ul className="space-y-2">
            {marketingTips.map((tip: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" />
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Upgrade Suggestions */}
      {upgradeSuggestions.length > 0 && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-sage-600" />
            <CardTitle>Suggested Upgrades</CardTitle>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Improvements that could increase pet appeal and buyer urgency.
          </p>
          <div className="space-y-3">
            {upgradeSuggestions.map((upgrade: UpgradeSuggestion, i: number) => {
              const impactColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-gray-100 text-gray-600' };
              return (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900">{upgrade.name}</p>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${impactColors[upgrade.impact]}`}>
                      {upgrade.impact} impact
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{upgrade.description}</p>
                  {upgrade.estimated_cost && (
                    <p className="mt-1 text-xs font-medium text-gray-500">Est. cost: {upgrade.estimated_cost}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Property Details */}
      <Card className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-gray-400" />
          <CardTitle>Property Details</CardTitle>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-500">Type</dt>
            <dd className="capitalize text-gray-900">{property.property_type.replace('_', ' ')}</dd>
          </div>
          {property.beds != null && (
            <div>
              <dt className="font-medium text-gray-500">Beds / Baths</dt>
              <dd className="text-gray-900">{property.beds} / {property.baths}</dd>
            </div>
          )}
          {property.sqft != null && (
            <div>
              <dt className="font-medium text-gray-500">Square Footage</dt>
              <dd className="text-gray-900">{property.sqft.toLocaleString()} sqft</dd>
            </div>
          )}
          {property.lot_size && (
            <div>
              <dt className="font-medium text-gray-500">Lot Size</dt>
              <dd className="text-gray-900">{property.lot_size}</dd>
            </div>
          )}
        </dl>
        {property.listing_description && (
          <p className="mt-4 text-sm text-gray-600">{property.listing_description}</p>
        )}
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Disclaimer</p>
        <p className="mt-1">
          PetMatch Home Score is an assistive opinion tool. Scores and recommendations are generated
          using AI and publicly available data. They do not constitute a guarantee of animal safety,
          property suitability, or professional veterinary advice. Always conduct your own due
          diligence and consult with qualified professionals.
        </p>
      </div>
    </div>
  );
}
