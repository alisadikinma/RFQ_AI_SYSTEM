'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Factory, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { ModelWithDetails } from '@/lib/api/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ModelCardProps {
  model: ModelWithDetails;
}

export function ModelCard({ model }: ModelCardProps) {
  const totalMP = model.stations.reduce((sum, station) => sum + station.manpower, 0);
  const stationCount = model.stations.length;

  const bottleneck = model.stations.reduce((min, station) => {
    return station.machine.typical_uph < min.machine.typical_uph ? station : min;
  }, model.stations[0]);

  const uph = bottleneck?.machine.typical_uph || 0;

  return (
    <motion.div
      whileHover={{
        y: -4,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-1">
            {model.code}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {model.customer.name}
          </p>
        </div>
        <Badge
          variant={model.status === 'active' ? 'default' : 'secondary'}
          className={model.status === 'active' ? 'bg-success' : ''}
        >
          {model.status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {model.board_types.length > 0 && (
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

      <Link href={`/models/${model.id}`} className="block mt-4">
        <Button variant="ghost" className="w-full justify-between" size="sm">
          View Details
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </motion.div>
  );
}
