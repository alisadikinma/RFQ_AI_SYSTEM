'use client';

import { motion } from 'framer-motion';
import {
  Factory,
  Wrench,
  Users,
  DollarSign,
  Gauge,
  Package,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CostEstimate, ModelSummary } from '@/lib/rfq/types';

interface CostSummaryCardProps {
  costEstimate: CostEstimate;
  modelSummary: ModelSummary;
  modelCode: string;
}

interface CostItem {
  icon: React.ElementType;
  label: string;
  value: string;
  note?: string;
  iconClass?: string;
}

export function CostSummaryCard({
  costEstimate,
  modelSummary,
  modelCode,
}: CostSummaryCardProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const costItems: CostItem[] = [
    {
      icon: Factory,
      label: 'Equipment Investment',
      value: formatCurrency(costEstimate.equipmentInvestment),
      note: `${modelSummary.totalStations} stations`,
      iconClass: 'text-blue-500',
    },
    {
      icon: Wrench,
      label: 'Fixture Cost (amortized)',
      value: formatCurrency(costEstimate.fixturesCost),
      note: 'Per model',
      iconClass: 'text-purple-500',
    },
    {
      icon: Users,
      label: 'Total Manpower',
      value: `${costEstimate.totalManpower} MP`,
      note: 'Operators required',
      iconClass: 'text-emerald-500',
    },
    {
      icon: DollarSign,
      label: 'Monthly Labor Cost',
      value: formatCurrency(costEstimate.monthlyLaborCost),
      note: `@ $700/MP avg`,
      iconClass: 'text-amber-500',
    },
    {
      icon: Gauge,
      label: 'Line UPH (Bottleneck)',
      value: `${costEstimate.lineUPH} UPH`,
      note: modelSummary.bottleneckStation ? `Limited by ${modelSummary.bottleneckStation}` : undefined,
      iconClass: 'text-orange-500',
    },
    {
      icon: Package,
      label: 'Monthly Capacity',
      value: `~${formatNumber(costEstimate.monthlyCapacity)} pcs`,
      note: `${costEstimate.lineUPH}×20hr×24day`,
      iconClass: 'text-cyan-500',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Cost Estimation
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            (Based on {modelCode})
          </span>
        </div>
      </div>

      {/* Cost Items Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {costItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('p-2 rounded-lg bg-white dark:bg-slate-700', item.iconClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {item.label}
                  </div>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {item.value}
                </div>
                {item.note && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.note}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Cost Per Unit - Featured */}
        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Estimated Test Cost Per Unit
              </div>
              <div className="text-2xl font-bold text-primary">
                ${costEstimate.costPerUnit.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Labor + Equipment Depreciation (36 months)
              </div>
            </div>
            <div className="hidden sm:block p-4 rounded-full bg-primary/10">
              <Calculator className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Disclaimer:</strong> Estimates based on similar historical model.
            Actual costs may vary based on specific requirements, customer specifications,
            and current market conditions.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
