'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/layout/PageTransition';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { StationMatchTable } from '@/components/rfq/results/StationMatchTable';
import { InvestmentBreakdown } from '@/components/rfq/results/InvestmentBreakdown';
import { CapacityChart } from '@/components/rfq/results/CapacityChart';
import {
  mockRecommendations,
  mockInvestmentBreakdown,
  mockCapacityData,
  mockStationDetails
} from '@/lib/data/mock-recommendations';

export default function RecommendationDetailPage() {
  const params = useParams();
  const router = useRouter();

  const recommendation = mockRecommendations.find(
    (r) => r.model_id === params.modelId
  );

  if (!recommendation) {
    return <div>Recommendation not found</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6"
          >
            <div className="flex items-start gap-6">
              <CircularProgress score={recommendation.similarity_score} delay={0.2} />

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {recommendation.model_code}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                      {recommendation.model_name}
                    </p>
                  </div>
                  <Badge className="text-base px-4 py-1">
                    {recommendation.similarity_score}% Match
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-4">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    {recommendation.customer}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">{recommendation.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Last run: {recommendation.last_run}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <StationMatchTable stationDetails={mockStationDetails} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvestmentBreakdown breakdown={mockInvestmentBreakdown} />

          <div className="space-y-6">
            <CapacityChart data={mockCapacityData} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                👥 Manpower Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">
                    Total Manpower
                  </span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {recommendation.total_manpower} MP
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400">
                    Estimated UPH
                  </span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {recommendation.estimated_uph} units/h
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <span className="text-red-700 dark:text-red-300">
                    Bottleneck Station
                  </span>
                  <span className="font-bold text-red-700 dark:text-red-300">
                    {recommendation.bottleneck_station}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
