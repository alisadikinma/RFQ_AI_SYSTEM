'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface TopListItem {
  id: string;
  name: string;
  count: number;
}

interface TopListProps {
  title: string;
  icon: string;
  items: TopListItem[];
  onViewAll?: () => void;
}

const listItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.6 + i * 0.1 }
  })
};

export function TopList({ title, icon, items, onViewAll }: TopListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {title}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          No data available
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              custom={i}
              variants={listItemVariants}
              initial="initial"
              animate="animate"
              className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium text-slate-900 dark:text-white truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums font-medium shrink-0 ml-2">
                {item.count}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
