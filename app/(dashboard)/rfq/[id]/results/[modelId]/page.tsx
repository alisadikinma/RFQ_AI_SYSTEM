'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileDown, FileSpreadsheet, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { StationComparisonTable } from '@/components/rfq/StationComparisonTable';
import { StationDetailsTable } from '@/components/rfq/StationDetailsTable';
import { CostSummaryCard } from '@/components/rfq/CostSummaryCard';
import type { ModelDetail, ComparisonStats, CostEstimate, ModelComparisonResponse } from '@/lib/rfq/types';

interface PageParams {
  id: string;
  modelId: string;
}

export default function ModelComparisonPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id: rfqId, modelId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelDetail | null>(null);
  const [comparison, setComparison] = useState<ComparisonStats | null>(null);
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);

  // Get requested codes from URL
  const codesParam = searchParams.get('codes');
  const requestedCodes = codesParam ? codesParam.split(',').filter(Boolean) : [];

  useEffect(() => {
    if (modelId && requestedCodes.length > 0) {
      loadModelComparison();
    } else if (requestedCodes.length === 0) {
      setError('No station codes provided for comparison');
      setIsLoading(false);
    }
  }, [modelId, codesParam]);

  const loadModelComparison = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/rfq/${rfqId}/model/${modelId}?codes=${encodeURIComponent(codesParam || '')}`
      );

      const result: ModelComparisonResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load model details');
      }

      setModel(result.model);
      setComparison(result.comparison);
      setCostEstimate(result.costEstimate || null);
    } catch (err) {
      console.error('Failed to load model comparison:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model details');
      toast.error('Failed to load model comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    toast.info('PDF export coming soon');
  };

  const handleExportExcel = () => {
    toast.info('Excel export coming soon');
  };

  const handleUseAsReference = () => {
    toast.success('Model selected as reference');
    router.push(`/rfq/${rfqId}/results`);
  };

  // Calculate similarity percentage
  const similarityPercentage = comparison
    ? Math.round(
        ((comparison.matched.length /
          (comparison.matched.length + comparison.missing.length + comparison.extra.length)) *
          2 *
          comparison.matched.length) /
          (requestedCodes.length + (model?.stations.length || 0)) *
          100
      )
    : 0;

  // Use Jaccard formula: intersection / union
  const jaccardSimilarity = comparison && model
    ? Math.round(
        (comparison.matched.length /
          (requestedCodes.length +
            model.stations.filter((s, i, arr) =>
              arr.findIndex(x => x.stationCode === s.stationCode) === i
            ).length -
            comparison.matched.length)) *
          100
      )
    : 0;

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <LoadingSkeleton className="h-10 w-32" />
          <LoadingSkeleton className="h-32 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-48 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (error || !model || !comparison) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Button>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
              {error || 'Model not found'}
            </h3>
            <p className="text-red-600 dark:text-red-400">
              Unable to load the model comparison. Please try again.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </Button>

        {/* Header with Match Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 to-emerald-500/5 rounded-xl border-2 border-primary/20 p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl font-bold text-primary">{jaccardSimilarity}%</span>
            <span className="text-xl text-slate-600 dark:text-slate-400">MATCH</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Your Request */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-lg">📋</span> YOUR REQUEST
              </h4>
              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <p>Stations: {requestedCodes.length} requested</p>
                <p>Unique codes: {requestedCodes.join(', ')}</p>
              </div>
            </div>

            {/* Historical Model */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-lg">📦</span> HISTORICAL MODEL
              </h4>
              <div className="space-y-1">
                <p className="font-medium text-slate-900 dark:text-white">{model.code}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customer: {model.customer.name || model.customer.code}
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                    {model.status}
                  </Badge>
                  <span>{model.summary.totalStations} stations</span>
                  <span>{model.summary.totalManpower} MP</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Station Comparison (Side-by-Side) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StationComparisonTable
            requestedCodes={requestedCodes}
            modelStations={model.stations}
            comparison={comparison}
            modelCode={model.code}
          />
        </motion.div>

        {/* Match Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
        >
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            📈 MATCH SUMMARY
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Matched</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                {comparison.matched.length} stations
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-500">
                {comparison.matchPercentage}% of your request covered
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <span className="text-lg">➕</span>
                <span className="font-medium">Extra</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                {comparison.extra.length} stations
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-500">
                Model has, you didn&apos;t request
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <span className="text-lg">➖</span>
                <span className="font-medium">Missing</span>
              </div>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">
                {comparison.missing.length} stations
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-500">
                You need but model doesn&apos;t have
              </p>
            </div>
          </div>
          {comparison.matched.length === requestedCodes.length && (
            <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-300 dark:border-emerald-700">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                💡 The historical model covers ALL your requested stations
                {comparison.extra.length > 0 && ' plus has additional stations you may want to consider.'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Station Details Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StationDetailsTable
            stations={model.stations}
            summary={model.summary}
            modelCode={model.code}
          />
        </motion.div>

        {/* Cost Estimation */}
        {costEstimate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <CostSummaryCard
              costEstimate={costEstimate}
              modelSummary={model.summary}
              modelCode={model.code}
            />
          </motion.div>
        )}

        {/* Recommendations */}
        {comparison.extra.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6"
          >
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              💡 RECOMMENDATIONS
            </h4>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Consider these additional stations from {model.code}:
            </p>
            <ul className="space-y-2">
              {comparison.extra.map((code) => {
                const station = model.stations.find(
                  (s) => s.stationCode.toUpperCase() === code.toUpperCase()
                );
                return (
                  <li key={code} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <div>
                      <span className="font-mono font-medium text-blue-700 dark:text-blue-400">
                        {code}
                      </span>
                      {station && (
                        <span className="text-slate-600 dark:text-slate-400">
                          {' '}- {station.description || station.stationName}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-wrap gap-3 justify-center pt-4"
        >
          <Button variant="outline" onClick={handleExportPDF} className="gap-2">
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
          <Button onClick={handleUseAsReference} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Use as Reference
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
