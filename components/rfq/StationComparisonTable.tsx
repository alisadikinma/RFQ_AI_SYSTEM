'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Plus, Minus, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModelStationDetail, ComparisonStats } from '@/lib/rfq/types';

interface StationComparisonTableProps {
  requestedCodes: string[];
  modelStations: ModelStationDetail[];
  comparison: ComparisonStats;
  modelCode: string;
}

type ComparisonStatus = 'matched' | 'extra' | 'missing';

interface ComparisonRow {
  status: ComparisonStatus;
  yourStation: string | null;
  modelStation: ModelStationDetail | null;
  stationName: string;
  description: string;
}

export function StationComparisonTable({
  requestedCodes,
  modelStations,
  comparison,
  modelCode,
}: StationComparisonTableProps) {
  // Build comparison rows
  const rows: ComparisonRow[] = [];

  // Add matched stations first
  for (const code of comparison.matched) {
    const modelStation = modelStations.find(
      s => s.stationCode.toUpperCase() === code.toUpperCase()
    );
    rows.push({
      status: 'matched',
      yourStation: code,
      modelStation: modelStation || null,
      stationName: modelStation?.stationName || code,
      description: modelStation?.description || '',
    });
  }

  // Add missing stations (in request but not in model)
  for (const code of comparison.missing) {
    rows.push({
      status: 'missing',
      yourStation: code,
      modelStation: null,
      stationName: code,
      description: 'Required but not in historical model',
    });
  }

  // Add extra stations (in model but not in request)
  for (const code of comparison.extra) {
    const modelStation = modelStations.find(
      s => s.stationCode.toUpperCase() === code.toUpperCase()
    );
    rows.push({
      status: 'extra',
      yourStation: null,
      modelStation: modelStation || null,
      stationName: modelStation?.stationName || code,
      description: modelStation?.description || '',
    });
  }

  const statusConfig = {
    matched: {
      icon: Equal,
      label: 'MATCH',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconClass: 'text-emerald-500',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    extra: {
      icon: Plus,
      label: 'EXTRA IN MODEL',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      iconClass: 'text-blue-500',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    },
    missing: {
      icon: Minus,
      label: 'MISSING',
      bgClass: 'bg-orange-50 dark:bg-orange-900/20',
      iconClass: 'text-orange-500',
      badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    },
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Station Comparison (Side-by-Side)
        </h3>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-1/3">
                YOUR REQUEST
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 w-1/3">
                STATUS
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 w-1/3">
                {modelCode}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map((row, index) => {
              const config = statusConfig[row.status];
              const Icon = config.icon;

              return (
                <motion.tr
                  key={`${row.status}-${row.yourStation || row.modelStation?.stationCode}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(config.bgClass)}
                >
                  {/* Your Request */}
                  <td className="px-4 py-3">
                    {row.yourStation ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-mono font-medium text-slate-900 dark:text-white">
                            {row.yourStation}
                          </span>
                        </div>
                        {row.status === 'matched' && row.modelStation && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                            {row.stationName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', config.badgeClass)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </td>

                  {/* Historical Model */}
                  <td className="px-4 py-3">
                    {row.modelStation || row.status === 'extra' ? (
                      <div>
                        <div className="flex items-center gap-2">
                          {row.status === 'extra' && <Plus className="w-4 h-4 text-blue-500" />}
                          {row.status === 'matched' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          <span className="font-mono font-medium text-slate-900 dark:text-white">
                            {row.modelStation?.stationCode || row.stationName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                          {row.description || row.modelStation?.stationName}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">-</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {comparison.matched.length} Matched
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({comparison.matchPercentage}% of your request)
            </span>
          </div>
          {comparison.extra.length > 0 && (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <span className="font-medium text-blue-700 dark:text-blue-400">
                {comparison.extra.length} Extra
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                (model has, you didn&apos;t request)
              </span>
            </div>
          )}
          {comparison.missing.length > 0 && (
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-orange-700 dark:text-orange-400">
                {comparison.missing.length} Missing
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                (you need but model doesn&apos;t have)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
