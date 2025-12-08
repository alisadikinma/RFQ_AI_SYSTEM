'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, DollarSign, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from '@/components/shared/CircularProgress';
import Link from 'next/link';

interface RecommendationCardProps {
  recommendation: any;
  rank: number;
  delay?: number;
  rfqId: string;
}

export function RecommendationCard({
  recommendation,
  rank,
  delay = 0,
  rfqId
}: RecommendationCardProps) {
  const isTopMatch = rank === 1;

  const cardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any, delay }
    }
  };

  const topCardGlow = {
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(59, 130, 246, 0)',
        '0 0 30px 10px rgba(59, 130, 246, 0.1)',
        '0 0 0 0 rgba(59, 130, 246, 0)'
      ],
      transition: { duration: 2, repeat: 2 }
    }
  };

  const matchedCount = recommendation.matched_stations.length;
  const totalCount = matchedCount + recommendation.missing_stations.length;
  const boardTypeCount = Object.keys(recommendation.board_matches).length;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4 }}
      className={`relative bg-white dark:bg-slate-800 rounded-xl border-2 overflow-hidden ${
        isTopMatch
          ? 'border-primary-500'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {isTopMatch && (
        <>
          <motion.div
            variants={topCardGlow}
            animate="animate"
            className="absolute inset-0 pointer-events-none"
          />
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2">
            <p className="text-white font-bold text-sm flex items-center gap-2">
              <span className="text-lg">🏆</span>
              #{rank} BEST MATCH
            </p>
          </div>
        </>
      )}

      {!isTopMatch && (
        <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm">
            #{rank}
          </p>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start gap-6 mb-6">
          <CircularProgress
            score={recommendation.similarity_score}
            delay={delay + 0.3}
          />

          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              {recommendation.model_code}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              {recommendation.customer}
            </p>

            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className="gap-1">
                <span className="text-success">✓</span> {matchedCount}/{totalCount} stations matched
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <span className="text-success">✓</span> {boardTypeCount}/{boardTypeCount} board types
              </Badge>
            </div>

            {recommendation.missing_stations.length > 0 && (
              <div className="flex items-start gap-1 text-xs text-amber-600 dark:text-amber-400 mt-2">
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>
                  Missing: {recommendation.missing_stations.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              ${(recommendation.total_investment_usd / 1000).toFixed(0)}K
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {recommendation.total_manpower} MP
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {recommendation.estimated_uph} UPH
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {recommendation.bottleneck_station}
            </span>
          </div>
        </div>

        <Link href={`/rfq/${rfqId}/results/${recommendation.model_id}`}>
          <Button variant="outline" className="w-full gap-2">
            View Full Details
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
