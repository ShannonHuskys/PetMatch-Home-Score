'use client';

import {
  PawPrint,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Dog,
  Cat,
  Wrench,
  Heart,
  Home as HomeIcon,
  Shield,
  Bed,
  Bath,
  Maximize,
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { ScoreRing } from '@/components/ui/score-ring';

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
import type {
  Analysis,
  Property,
  PetProfile,
  SpeciesInsight,
  UpgradeSuggestion,
} from '@/types/database';

interface Props {
  analysis: Analysis;
  property: Property;
  pets: PetProfile[];
  brandingName: string;
}

const SUB_SCORES = [
  { key: 'traffic_safety_score', label: 'Traffic Safety', desc: 'How safe nearby streets and traffic are for pets' },
  { key: 'yard_score', label: 'Yard & Outdoor', desc: 'Fencing, lot size, and outdoor access' },
  { key: 'senior_comfort_score', label: 'Senior Pet Comfort', desc: 'Stair access, flooring, and mobility-friendliness' },
  { key: 'exercise_score', label: 'Exercise Access', desc: 'Parks, trails, and walkability nearby' },
  { key: 'indoor_comfort_score', label: 'Indoor Comfort', desc: 'Flooring, layout, and pet-friendly features' },
  { key: 'noise_stress_score', label: 'Noise & Stress', desc: 'Quietness and calming environment' },
] as const;

export function SharedReportClient({ analysis, property, pets, brandingName }: Props) {
  const redFlags = Array.isArray(analysis.red_flags_json) ? analysis.red_flags_json : [];
  const highlights = Array.isArray(analysis.highlights_json) ? analysis.highlights_json : [];
  const speciesInsights = (analysis.species_insights_json || {}) as Record<string, SpeciesInsight | undefined>;
  const upgradeSuggestions = (Array.isArray(analysis.upgrade_suggestions_json)
    ? analysis.upgrade_suggestions_json
    : []) as UpgradeSuggestion[];
  const overall = analysis.overall_score || 0;
  const petNames = pets.map((p) => p.name).join(' & ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-sage-50">
      {/* Sticky branded header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <PawPrint className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{brandingName}</p>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Pet Suitability Report</p>
            </div>
          </div>
          <div className="hidden text-right text-xs text-gray-400 sm:block">
            Prepared for {petNames || 'your pet'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        {/* Hero */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            {pets.map((pet) => {
              const Icon = pet.species === 'dog' ? Dog : pet.species === 'cat' ? Cat : PawPrint;
              return (
                <span
                  key={pet.id}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 font-medium text-brand-700"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {pet.name}
                  {pet.breed ? <span className="text-brand-500/80">· {pet.breed}</span> : null}
                </span>
              );
            })}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{property.address}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            {[property.city, property.state, property.postal_code].filter(Boolean).join(', ')}
          </p>

          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
            <ScoreRing score={overall} size="lg" label="Pet Match Score" />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-bold text-gray-900">
                {overall >= 80
                  ? 'Excellent fit for ' + petNames
                  : overall >= 60
                    ? 'Good match — with some things to know'
                    : overall >= 40
                      ? 'Mixed — a few important considerations'
                      : 'Tough fit — significant pet concerns'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {analysis.ai_summary}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
            {property.beds != null && (
              <div className="flex items-center justify-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {property.beds} bed
              </div>
            )}
            {property.baths != null && (
              <div className="flex items-center justify-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {property.baths} bath
              </div>
            )}
            {property.sqft != null && (
              <div className="flex items-center justify-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {property.sqft.toLocaleString()} sqft
              </div>
            )}
          </div>
        </div>

        {/* Scores grid */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            How this home scores
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUB_SCORES.map(({ key, label, desc }) => {
              const score = (analysis as unknown as Record<string, number | null>)[key];
              if (score == null) return null;
              const color = getScoreColor(score);
              return (
                <div key={key} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
                    <div className="flex items-baseline gap-1 flex-shrink-0">
                      <span className="text-2xl font-bold" style={{ color }}>
                        {score}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color }}>
                        {getScoreLabel(score)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Highlights & Watch-outs */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {highlights.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-500" />
                <CardTitle>What&apos;s Great</CardTitle>
              </div>
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {redFlags.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle>Watch-outs</CardTitle>
              </div>
              <ul className="space-y-2">
                {redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                    {flag}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Species insights */}
        {Object.keys(speciesInsights).length > 0 && (
          <div className="mb-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              For your {Object.keys(speciesInsights).join(' and ')}
            </h2>
            {Object.entries(speciesInsights).map(([species, insight]) => {
              if (!insight) return null;
              const Icon = species === 'dog' ? Dog : species === 'cat' ? Cat : PawPrint;
              const riskColor =
                insight.dealbreaker_risk === 'low'
                  ? 'bg-green-100 text-green-700'
                  : insight.dealbreaker_risk === 'moderate'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700';
              return (
                <Card key={species}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-brand-600" />
                      <CardTitle className="capitalize">{species} considerations</CardTitle>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskColor}`}>
                      {insight.dealbreaker_risk === 'low'
                        ? 'No major concerns'
                        : insight.dealbreaker_risk === 'moderate'
                          ? 'Some concerns'
                          : 'Significant concerns'}
                    </span>
                  </div>

                  {insight.must_haves_met?.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-600">
                        Must-haves this home meets
                      </p>
                      <ul className="space-y-1">
                        {insight.must_haves_met.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insight.must_haves_missing?.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">
                        Worth considering
                      </p>
                      <ul className="space-y-1">
                        {insight.must_haves_missing.map((m, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-400" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insight.strengths?.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Strengths
                      </p>
                      <ul className="space-y-1">
                        {insight.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insight.concerns?.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Things to be aware of
                      </p>
                      <ul className="space-y-1">
                        {insight.concerns.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                            {c}
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

        {/* Upgrade suggestions — framed as "ideas if you buy" */}
        {upgradeSuggestions.length > 0 && (
          <Card className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-sage-600" />
              <CardTitle>Ideas if you buy this home</CardTitle>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Pet-friendly improvements that could make this home even better for {petNames || 'your pet'}.
            </p>
            <div className="space-y-3">
              {upgradeSuggestions.map((u, i) => {
                const impactColors = {
                  high: 'bg-green-100 text-green-700',
                  medium: 'bg-amber-100 text-amber-700',
                  low: 'bg-gray-100 text-gray-600',
                };
                return (
                  <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{u.name}</p>
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${impactColors[u.impact]}`}>
                        {u.impact} impact
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{u.description}</p>
                    {u.estimated_cost && (
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        Est. cost: {u.estimated_cost}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Property details */}
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <HomeIcon className="h-5 w-5 text-gray-400" />
            <CardTitle>About this home</CardTitle>
          </div>
          {property.listing_description && (
            <p className="mb-3 text-sm leading-relaxed text-gray-600">
              {property.listing_description}
            </p>
          )}
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-400">Type</dt>
              <dd className="capitalize text-gray-900">{property.property_type.replace('_', ' ')}</dd>
            </div>
            {property.lot_size && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Lot Size</dt>
                <dd className="text-gray-900">{property.lot_size}</dd>
              </div>
            )}
            {property.flooring_type && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Flooring</dt>
                <dd className="capitalize text-gray-900">{property.flooring_type}</dd>
              </div>
            )}
            {property.fencing_type && property.fencing_type !== 'none' && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Fencing</dt>
                <dd className="capitalize text-gray-900">{property.fencing_type.replace('_', ' ')}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Agent footer */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-6 w-6 flex-shrink-0 text-brand-100" />
            <div>
              <h3 className="font-semibold">Want to talk about this home?</h3>
              <p className="mt-1 text-sm text-brand-50">
                This report was prepared for you by your real estate agent. Reach out anytime with
                questions about how {petNames || 'your pet'} would do in this home.
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wider text-brand-200">
                — {brandingName}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          This is an assistive tool. Scores are AI-generated. Always tour homes in person before
          deciding.
        </p>
      </main>
    </div>
  );
}
