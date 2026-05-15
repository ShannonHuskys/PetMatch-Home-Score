'use client';

import Link from 'next/link';
import {
  MapPin,
  Home,
  PawPrint,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ScoreRing } from '@/components/ui/score-ring';
import type { PropertyWithRelations } from '@/types/database';

interface DashboardClientProps {
  properties: PropertyWithRelations[];
}

const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co';

export function DashboardClient({ properties }: DashboardClientProps) {
  return (
    <div className="mx-auto max-w-6xl">
      {isDemoMode && (
        <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          <strong>Demo Mode</strong> — You&apos;re viewing sample data. Connect Supabase credentials in{' '}
          <code className="font-mono">.env.local</code> to enable full functionality.
        </div>
      )}
      <PageHeader
        title="Dashboard"
        description="Your property analyses at a glance"
        action={
          <Link href="/analyses/quick">
            <Button>
              <Sparkles className="h-4 w-4" />
              New Analysis
            </Button>
          </Link>
        }
      />

      {properties.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No analyses yet"
          description="Paste a listing, pick your client's pet, and get a branded report in under a minute."
        >
          <Link href="/analyses/quick">
            <Button>
              <Sparkles className="h-4 w-4" />
              Try Quick Analyze
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => {
            const latestAnalysis = property.analyses[0];
            const petCount = property.pet_profiles.length;

            return (
              <Link
                key={property.id}
                href={latestAnalysis ? `/analyses/${latestAnalysis.id}` : '#'}
              >
                <Card
                  padding="none"
                  className="group overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="score-gradient p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white/80">
                          {property.property_type === 'condo'
                            ? 'Condo'
                            : property.property_type === 'townhouse'
                              ? 'Townhouse'
                              : 'Single Family'}
                        </p>
                        <h3 className="mt-1 text-lg font-bold text-white line-clamp-1">
                          {property.address}
                        </h3>
                      </div>
                      {latestAnalysis?.overall_score != null && (
                        <div className="ml-3 flex-shrink-0">
                          <ScoreRing
                            score={latestAnalysis.overall_score}
                            size="sm"
                            showLabel={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {property.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {property.city}, {property.state}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <PawPrint className="h-3.5 w-3.5" />
                        {petCount} pet{petCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {property.pet_profiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {property.pet_profiles.map((pet) => (
                          <span
                            key={pet.id}
                            className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                          >
                            {pet.name} ({pet.species})
                          </span>
                        ))}
                      </div>
                    )}

                    {latestAnalysis && (
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">
                          {new Date(latestAnalysis.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:text-brand-700">
                          View Report <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
