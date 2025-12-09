'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, MessageSquare, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoMatchesFoundProps {
  requestedCodes: string[];
  closestMatch?: {
    modelCode: string;
    similarity: number;
  };
  threshold?: number;
  onEditRFQ: () => void;
  onRequestManualQuote?: () => void;
}

export function NoMatchesFound({
  requestedCodes,
  closestMatch,
  threshold = 70,
  onEditRFQ,
  onRequestManualQuote,
}: NoMatchesFoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-6"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50">
          <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No Similar Models Found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            No historical models found with similarity &ge; {threshold}%
          </p>
        </div>
      </div>

      {/* Your stations */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Your unique stations ({requestedCodes.length}):
        </h4>
        <div className="flex flex-wrap gap-2">
          {requestedCodes.map((code) => (
            <span
              key={code}
              className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono"
            >
              {code}
            </span>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 mb-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h4 className="font-medium text-slate-900 dark:text-white">Suggestions</h4>
        </div>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-slate-400 mt-1">&bull;</span>
            <span>This may be a new product type not yet in our database</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400 mt-1">&bull;</span>
            <span>Try reducing station requirements to find partial matches</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400 mt-1">&bull;</span>
            <span>Contact engineering team for manual quotation</span>
          </li>
        </ul>
      </div>

      {/* Closest match info */}
      {closestMatch && (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium">Closest match found:</span>{' '}
            <span className="font-mono">{closestMatch.modelCode}</span>{' '}
            <span className="text-orange-600 dark:text-orange-400">
              ({closestMatch.similarity}% similarity)
            </span>
            {' '}&mdash; below threshold
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={onEditRFQ} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Edit RFQ
        </Button>
        {onRequestManualQuote && (
          <Button onClick={onRequestManualQuote} className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Request Manual Quote
          </Button>
        )}
      </div>
    </motion.div>
  );
}
