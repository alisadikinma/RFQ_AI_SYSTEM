'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Factory, 
  Users, 
  Banknote,
  Cpu,
  CircuitBoard,
  Lightbulb,
  Usb,
  Radio,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { ModelGroupListItem, formatShortNumber } from '@/lib/api/model-groups';
import { Badge } from '@/components/ui/badge';

interface ModelGroupCardProps {
  group: ModelGroupListItem;
}

// Board type icons mapping
const boardTypeIcons: Record<string, React.ElementType> = {
  'Main Board': Cpu,
  'Sub Board': CircuitBoard,
  'LED Board': Lightbulb,
  'USB Board': Usb,
  'SUB_ANT Board': Radio,
  'Power Board': Banknote,
  'Display Board': LayoutGrid,
  'Sensor Board': Radio,
  'RF Board': Radio,
};

// Board type colors
const boardTypeColors: Record<string, string> = {
  'Main Board': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Sub Board': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'LED Board': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'USB Board': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'SUB_ANT Board': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Power Board': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Display Board': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Sensor Board': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'RF Board': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

export function ModelGroupCard({ group }: ModelGroupCardProps) {
  return (
    <Link href={`/models/${group.id}`} className="block">
      <motion.div
        whileHover={{
          y: -4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 cursor-pointer h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1 truncate">
              {group.typeModel}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {group.customerName}
            </p>
          </div>
          <Badge
            variant={group.status === 'active' ? 'default' : 'secondary'}
            className={group.status === 'active' ? 'bg-success ml-2 shrink-0' : 'ml-2 shrink-0'}
          >
            {group.status === 'active' ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Board Types */}
        {group.boardTypes && group.boardTypes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {group.totalBoards} Board{group.totalBoards > 1 ? 's' : ''}:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.boardTypes.slice(0, 5).map((type, index) => {
                const Icon = boardTypeIcons[type] || CircuitBoard;
                const colorClass = boardTypeColors[type] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
                return (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colorClass}`}
                  >
                    <Icon className="w-3 h-3" />
                    {type.replace(' Board', '')}
                  </span>
                );
              })}
              {group.boardTypes.length > 5 && (
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  +{group.boardTypes.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Factory className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {group.totalStations}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Stations</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {group.totalManpower}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">MP</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Banknote className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatShortNumber(group.totalInvestment)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Invest</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 font-medium">
          <span>View Details</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.div>
    </Link>
  );
}
