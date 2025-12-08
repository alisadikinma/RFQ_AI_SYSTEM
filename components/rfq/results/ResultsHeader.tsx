'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Download, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ResultsHeaderProps {
  rfqId: string;
  customer: string;
  modelName: string;
  submittedAt: string;
  processedIn: number;
  stationCount: number;
  boardTypeCount: number;
  targetUph?: number;
}

export function ResultsHeader({
  rfqId,
  customer,
  modelName,
  submittedAt,
  processedIn,
  stationCount,
  boardTypeCount,
  targetUph
}: ResultsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800 p-6 mb-8"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            className="w-12 h-12 rounded-full bg-success flex items-center justify-center"
          >
            <CheckCircle2 className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              RFQ Analysis Complete
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Your recommendations are ready
            </p>
          </div>
        </div>

        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{rfqId}</Badge>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {customer} • {modelName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {submittedAt}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Processed in {processedIn}s
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Input</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {stationCount} stations
            </p>
            <p className="text-xs text-slate-500">
              across {boardTypeCount} board types
            </p>
          </div>
          {targetUph && (
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Target</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {targetUph} UPH
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
