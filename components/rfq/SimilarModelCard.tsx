'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Layers, CheckCircle2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SimilarModel } from '@/lib/rfq/types';

interface SimilarModelCardProps {
  model: SimilarModel;
  rank: 1 | 2 | 3;
  onViewDetails: (modelId: string) => void;
}

const rankConfig = {
  1: {
    emoji: '1st',
    label: 'Best Match',
    bgClass: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20',
    borderClass: 'border-amber-300 dark:border-amber-700',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  2: {
    emoji: '2nd',
    label: 'Runner Up',
    bgClass: 'bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50',
    borderClass: 'border-slate-300 dark:border-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  3: {
    emoji: '3rd',
    label: 'Third Place',
    bgClass: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
    borderClass: 'border-orange-300 dark:border-orange-700',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
  },
};

export function SimilarModelCard({ model, rank, onViewDetails }: SimilarModelCardProps) {
  const config = rankConfig[rank];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.1 }}
      className={cn(
        'rounded-xl border-2 p-5 transition-shadow hover:shadow-lg',
        config.bgClass,
        config.borderClass
      )}
    >
      {/* Header with rank and similarity */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={cn('px-3 py-1 rounded-full text-sm font-bold', config.badgeClass)}>
            {config.emoji}
          </span>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {model.modelCode}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {model.customerName || model.customerCode}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {model.similarity}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Match
          </div>
        </div>
      </div>

      {/* Model stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4" />
          <span>{model.stationCount} stations</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Users className="w-4 h-4" />
          <span>{model.totalManpower} MP</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Layers className="w-4 h-4" />
          <span>{model.boardTypes.length} board{model.boardTypes.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Station match summary */}
      <div className="space-y-2 mb-4">
        {/* Matched stations */}
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
            {model.matchedStations.length} matched
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            of your stations
          </span>
        </div>

        {/* Extra stations */}
        {model.extraStations.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4 text-blue-500" />
            <span className="text-blue-700 dark:text-blue-400 font-medium">
              {model.extraStations.length} extra
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              you might also need
            </span>
          </div>
        )}

        {/* Missing stations */}
        {model.missingStations.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Minus className="w-4 h-4 text-orange-500" />
            <span className="text-orange-700 dark:text-orange-400 font-medium">
              {model.missingStations.length} missing
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              you need but model lacks
            </span>
          </div>
        )}
      </div>

      {/* View details button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => onViewDetails(model.modelId)}
      >
        View Details
        <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}
