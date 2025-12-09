'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SimilarModelCard } from '@/components/rfq/SimilarModelCard';
import { NoMatchesFound } from '@/components/rfq/NoMatchesFound';
import { StationResolutionTable, ResolutionSummaryCompact } from '@/components/rfq/StationResolutionTable';
import type { ResolutionResult, SimilarModel, SimilaritySearchResponse } from '@/lib/rfq/types';

interface SimilarityResultsStepProps {
  data: {
    resolution?: ResolutionResult;
    customerId?: string;
    modelName?: string;
  };
  onChange: (data: any) => void;
  rfqId?: string;
}

type SearchPhase = 'idle' | 'searching' | 'results';

export function SimilarityResultsStep({ data, onChange, rfqId }: SimilarityResultsStepProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [similarModels, setSimilarModels] = useState<SimilarModel[]>([]);
  const [closestMatch, setClosestMatch] = useState<{ modelCode: string; similarity: number } | null>(null);

  const resolution = data?.resolution;
  const uniqueCodes = resolution?.summary?.uniqueCodes || [];

  // Auto-search on mount if we have codes
  useEffect(() => {
    if (uniqueCodes.length > 0 && phase === 'idle') {
      handleSearch();
    }
  }, [uniqueCodes.length]);

  const handleSearch = useCallback(async () => {
    if (uniqueCodes.length === 0) {
      toast.error('No station codes to search');
      return;
    }

    setPhase('searching');

    try {
      const response = await fetch('/api/rfq/similarity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationCodes: uniqueCodes,
          limit: 3,
          minSimilarity: 70,
          customerId: data?.customerId,
        }),
      });

      const result: SimilaritySearchResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }

      setSimilarModels(result.results);
      setClosestMatch(result.closestMatch || null);
      setPhase('results');

      // Update parent state with results
      onChange({
        ...data,
        similarModels: result.results,
        hasMatches: result.hasMatches,
      });

      if (result.hasMatches) {
        toast.success(`Found ${result.results.length} similar model(s)`);
      } else {
        toast.info('No similar models found above threshold');
      }
    } catch (error) {
      console.error('Similarity search error:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed');
      setPhase('results');
    }
  }, [uniqueCodes, data, onChange]);

  const handleViewDetails = useCallback((modelId: string) => {
    // Navigate to detail page with the station codes as query param
    const codesParam = uniqueCodes.join(',');
    const basePath = rfqId ? `/rfq/${rfqId}/results/${modelId}` : `/rfq/compare/${modelId}`;
    router.push(`${basePath}?codes=${encodeURIComponent(codesParam)}`);
  }, [uniqueCodes, rfqId, router]);

  const handleEditRFQ = useCallback(() => {
    // Go back to station input step
    onChange({ ...data, goToStep: 2 });
  }, [data, onChange]);

  // No resolution data yet
  if (!resolution) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Waiting for Station Data
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Complete the station resolution step first to search for similar models.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Find Similar Models
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Searching for historical models matching your {uniqueCodes.length} station code(s)
        </p>
      </div>

      {/* Resolution Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-slate-900 dark:text-white">
            Station Resolution Summary
          </h4>
          <ResolutionSummaryCompact resolution={resolution} />
        </div>
        <div className="flex flex-wrap gap-2">
          {uniqueCodes.map((code) => (
            <span
              key={code}
              className="px-2 py-1 rounded bg-primary/10 text-primary text-sm font-mono"
            >
              {code}
            </span>
          ))}
        </div>
      </div>

      {/* Searching Phase */}
      {phase === 'searching' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Searching for Similar Models...
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
            Comparing your station requirements against historical models using Jaccard similarity.
          </p>
        </motion.div>
      )}

      {/* Results Phase */}
      {phase === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Refresh button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleSearch} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Re-search
            </Button>
          </div>

          {/* Results */}
          {similarModels.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  TOP {similarModels.length} Similar Models
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {similarModels.map((model, index) => (
                  <SimilarModelCard
                    key={model.modelId}
                    model={model}
                    rank={(index + 1) as 1 | 2 | 3}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            </>
          ) : (
            <NoMatchesFound
              requestedCodes={uniqueCodes}
              closestMatch={closestMatch || undefined}
              threshold={70}
              onEditRFQ={handleEditRFQ}
            />
          )}
        </motion.div>
      )}

      {/* Idle Phase - Manual trigger button */}
      {phase === 'idle' && uniqueCodes.length > 0 && (
        <div className="text-center py-8">
          <Button onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
            Search Similar Models
          </Button>
        </div>
      )}
    </div>
  );
}
