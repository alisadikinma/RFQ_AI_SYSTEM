'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Factory, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ModelWithDetails, ModelListItem } from '@/lib/api/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Support both full ModelWithDetails and lightweight ModelListItem
type ModelCardData = ModelWithDetails | (ModelListItem & { stations?: never });

interface ModelCardProps {
  model: ModelCardData;
}

export function ModelCard({ model }: ModelCardProps) {
  // Handle both full stations array and pre-aggregated data
  const hasStations = 'stations' in model && Array.isArray(model.stations) && model.stations.length > 0;
  
  let stationCount: number;
  let totalMP: number;
  let uph: number;

  if (hasStations) {
    // Full data with stations array
    const stations = model.stations!;
    stationCount = stations.length;
    totalMP = stations.reduce((sum, station) => sum + station.manpower, 0);
    const bottleneck = stations.reduce((min, station) => {
      return station.machine.typical_uph < min.machine.typical_uph ? station : min;
    }, stations[0]);
    uph = bottleneck?.machine.typical_uph || 0;
  } else {
    // Lightweight data with pre-aggregated values
    const listItem = model as ModelListItem;
    stationCount = listItem.station_count || 0;
    totalMP = listItem.total_manpower || 0;
    uph = listItem.min_uph || 0;
  }

  return (
    <Link href={`/models/${model.id}`} className="block">
      <motion.div
        whileHover={{
          y: -4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer h-full"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1 truncate">
              {model.code}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {model.customer.name}
            </p>
          </div>
          <Badge
            variant={model.status === 'active' ? 'default' : 'secondary'}
            className={model.status === 'active' ? 'bg-success ml-2 shrink-0' : 'ml-2 shrink-0'}
          >
            {model.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {model.board_types && model.board_types.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Board Types:</p>
            <div className="flex flex-wrap gap-2">
              {model.board_types.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 rounded text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Factory className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {stationCount}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Stations</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {totalMP}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">MP</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {uph}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">UPH</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 font-medium">
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>
    </Link>
  );
}
