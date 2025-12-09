'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ModelStationDetail, ModelSummary } from '@/lib/rfq/types';

interface StationDetailsTableProps {
  stations: ModelStationDetail[];
  summary: ModelSummary;
  modelCode: string;
}

interface BoardTypeGroup {
  boardType: string;
  stations: ModelStationDetail[];
  subtotal: {
    manpower: number;
    minUPH: number | null;
    investment: number;
  };
}

export function StationDetailsTable({
  stations,
  summary,
  modelCode,
}: StationDetailsTableProps) {
  // Group stations by board type
  const groupedStations = stations.reduce((acc, station) => {
    const boardType = station.boardType || 'MAIN';
    if (!acc[boardType]) {
      acc[boardType] = [];
    }
    acc[boardType].push(station);
    return acc;
  }, {} as Record<string, ModelStationDetail[]>);

  // Calculate subtotals for each board type
  const boardTypeGroups: BoardTypeGroup[] = Object.entries(groupedStations).map(
    ([boardType, boardStations]) => {
      const stationsWithUPH = boardStations.filter(s => s.uph && s.uph > 0);
      const minUPH = stationsWithUPH.length > 0
        ? Math.min(...stationsWithUPH.map(s => s.uph!))
        : null;

      return {
        boardType,
        stations: boardStations.sort((a, b) => a.sequence - b.sequence),
        subtotal: {
          manpower: boardStations.reduce((sum, s) => sum + s.manpower, 0),
          minUPH,
          investment: boardStations.reduce((sum, s) => sum + (s.investment || 0), 0),
        },
      };
    }
  );

  // Board type display names
  const boardTypeNames: Record<string, string> = {
    MAIN: 'Main Board (主板)',
    SUB: 'Sub Board (副板)',
    SINGLE: 'Single Board',
    FA: 'Final Assembly (整机)',
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === 0) return '-';
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '-';
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
          Historical Model - Full Station Details
        </h3>
        {summary.bottleneckStation && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Bottleneck: {summary.bottleneckStation} ({summary.bottleneckUPH} UPH)
            </span>
          </div>
        )}
      </div>

      {/* Tables by board type */}
      {boardTypeGroups.map((group, groupIndex) => (
        <motion.div
          key={group.boardType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          {/* Board Type Header */}
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              {boardTypeNames[group.boardType] || group.boardType}{' '}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                - {group.stations.length} stations
              </span>
            </h4>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider">
                  <th className="px-4 py-2 text-left text-slate-500 dark:text-slate-400 w-12">#</th>
                  <th className="px-4 py-2 text-left text-slate-500 dark:text-slate-400">Station</th>
                  <th className="px-4 py-2 text-left text-slate-500 dark:text-slate-400">Description</th>
                  <th className="px-4 py-2 text-center text-slate-500 dark:text-slate-400 w-16">MP</th>
                  <th className="px-4 py-2 text-center text-slate-500 dark:text-slate-400 w-16">UPH</th>
                  <th className="px-4 py-2 text-center text-slate-500 dark:text-slate-400 w-20">Cycle</th>
                  <th className="px-4 py-2 text-right text-slate-500 dark:text-slate-400 w-20">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.stations.map((station, index) => {
                  const isBottleneck = station.stationCode === summary.bottleneckStation;

                  return (
                    <tr
                      key={station.id}
                      className={cn(
                        'transition-colors',
                        station.isMatched && 'bg-emerald-50/50 dark:bg-emerald-900/10',
                        !station.isMatched && 'bg-blue-50/50 dark:bg-blue-900/10',
                        isBottleneck && 'bg-amber-50 dark:bg-amber-900/20'
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                        {station.sequence || index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {station.isMatched ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                          <span className={cn(
                            'font-mono font-medium',
                            station.isMatched
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-blue-700 dark:text-blue-400'
                          )}>
                            {station.stationCode}
                          </span>
                          {isBottleneck && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                              Bottleneck
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {station.description || station.stationName}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-slate-900 dark:text-white">
                        {station.manpower}
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-center text-sm font-medium',
                        isBottleneck
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-900 dark:text-white'
                      )}>
                        {station.uph || '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                        {formatTime(station.cycleTime)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600 dark:text-slate-400">
                        {formatCurrency(station.investment)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Subtotal */}
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <td colSpan={3} className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    SUBTOTAL ({boardTypeNames[group.boardType] || group.boardType})
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-900 dark:text-white">
                    {group.subtotal.manpower}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                    {group.subtotal.minUPH ? `${group.subtotal.minUPH}*` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                    -
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-900 dark:text-white">
                    {formatCurrency(group.subtotal.investment)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Matched with your request</span>
        </div>
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-500" />
          <span>Extra station (consider adding)</span>
        </div>
        <div className="text-xs">* UPH limited by bottleneck station</div>
      </div>
    </div>
  );
}
