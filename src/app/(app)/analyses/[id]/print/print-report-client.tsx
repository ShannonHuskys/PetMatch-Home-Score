'use client';

import { PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Analysis, Property, PetProfile, SpeciesInsight, UpgradeSuggestion } from '@/types/database';

interface Props {
  analysis: Analysis;
  property: Property;
  pets: PetProfile[];
  brandingName: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#0c93e7';
  if (score >= 40) return '#f59e0b';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export function PrintReportClient({ analysis, property, pets, brandingName }: Props) {
  const redFlags = Array.isArray(analysis.red_flags_json) ? analysis.red_flags_json : [];
  const highlights = Array.isArray(analysis.highlights_json) ? analysis.highlights_json : [];
  const overallScore = analysis.overall_score || 0;
  const scoreColor = getScoreColor(overallScore);

  const speciesInsights = analysis.species_insights_json as Record<string, SpeciesInsight> | null;
  const marketingTips = (Array.isArray(analysis.marketing_tips_json) ? analysis.marketing_tips_json : []) as string[];
  const upgradeSuggestions = (Array.isArray(analysis.upgrade_suggestions_json) ? analysis.upgrade_suggestions_json : []) as UpgradeSuggestion[];

  const subScores = [
    { label: 'Traffic Safety', score: analysis.traffic_safety_score },
    { label: 'Yard Suitability', score: analysis.yard_score },
    { label: 'Senior Comfort', score: analysis.senior_comfort_score },
    { label: 'Exercise Friendliness', score: analysis.exercise_score },
    { label: 'Indoor Comfort', score: analysis.indoor_comfort_score },
    { label: 'Noise & Stress', score: analysis.noise_stress_score },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-6 flex items-center justify-between">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Report
        </Button>
        <Button onClick={() => window.print()}>Print Report</Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <PawPrint className="h-8 w-8 text-brand-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{brandingName}</h1>
              <p className="text-sm text-gray-500">Pet Suitability Report</p>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>{new Date(analysis.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Property & Score */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{property.address}</h2>
            <p className="text-sm text-gray-500">
              {[property.city, property.state, property.postal_code].filter(Boolean).join(', ')}
            </p>
            <p className="mt-1 text-sm text-gray-500 capitalize">
              {property.property_type.replace('_', ' ')}
              {property.beds != null ? ` · ${property.beds} bed / ${property.baths} bath` : ''}
              {property.sqft != null ? ` · ${property.sqft.toLocaleString()} sqft` : ''}
            </p>
          </div>
          <div className="text-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
              style={{ backgroundColor: scoreColor }}
            >
              {overallScore}
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color: scoreColor }}>
              {getScoreLabel(overallScore)}
            </p>
          </div>
        </div>

        {/* Pets */}
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Pets Evaluated
          </h3>
          <div className="flex flex-wrap gap-2">
            {pets.map((pet) => (
              <span
                key={pet.id}
                className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
              >
                {pet.name} — {pet.breed || pet.species}, {pet.age_category}, {pet.size_category}
              </span>
            ))}
          </div>
        </div>

        {/* Sub-scores */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Category Scores
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {subScores.map(({ label, score }) =>
              score != null ? (
                <div key={label} className="rounded-lg border border-gray-100 p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: getScoreColor(score) }}>
                    {score}
                  </p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Summary */}
        {analysis.ai_summary && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-gray-700">{analysis.ai_summary}</p>
          </div>
        )}

        {/* Highlights & Red Flags */}
        <div className="mb-6 grid grid-cols-2 gap-6">
          {highlights.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-green-600">
                Highlights
              </h3>
              <ul className="space-y-1">
                {highlights.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {redFlags.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-600">
                Concerns
              </h3>
              <ul className="space-y-1">
                {redFlags.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Species-Specific Insights */}
        {speciesInsights && Object.keys(speciesInsights).length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Species-Specific Insights
            </h3>
            <div className="space-y-4">
              {Object.entries(speciesInsights).map(([species, insight]) => (
                <div key={species} className="rounded-lg border border-gray-100 p-4">
                  <h4 className="mb-2 text-sm font-semibold capitalize text-gray-800">
                    {species === 'dog' ? 'Dog Owner' : species === 'cat' ? 'Cat Owner' : species} Perspective
                  </h4>
                  {insight.strengths && insight.strengths.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-green-600">Strengths</p>
                      <ul className="mt-1 space-y-0.5">
                        {insight.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600">+ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insight.concerns && insight.concerns.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-amber-600">Concerns</p>
                      <ul className="mt-1 space-y-0.5">
                        {insight.concerns.map((c: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600">- {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insight.must_haves && insight.must_haves.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-600">Must-Haves</p>
                      <ul className="mt-1 space-y-0.5">
                        {insight.must_haves.map((m: string, i: number) => (
                          <li key={i} className="text-xs text-gray-600">* {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marketing Tips */}
        {marketingTips.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Marketing Tips for Pet Owners
            </h3>
            <ul className="space-y-1">
              {marketingTips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upgrade Suggestions */}
        {upgradeSuggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Suggested Upgrades
            </h3>
            <div className="space-y-2">
              {upgradeSuggestions.map((upgrade: UpgradeSuggestion, i: number) => (
                <div key={i} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{upgrade.name}</p>
                    {upgrade.estimated_cost && (
                      <span className="text-xs text-gray-500">{upgrade.estimated_cost}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-600">{upgrade.description}</p>
                  {upgrade.roi_note && (
                    <p className="mt-1 text-xs text-brand-600">{upgrade.roi_note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-400">
            This report was generated by {brandingName}, an AI-powered assistive tool. Scores and
            recommendations are based on listing data, neighborhood analysis, and AI reasoning. This
            is not a guarantee of animal safety or property suitability. Always consult qualified
            professionals for pet safety assessments.
          </p>
        </div>
      </div>
    </div>
  );
}
