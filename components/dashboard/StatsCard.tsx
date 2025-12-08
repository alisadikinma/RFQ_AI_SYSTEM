'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend: 'up' | 'down';
  trendValue: string;
  suffix?: string;
  delay?: number;
}

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }
  }
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  suffix = '',
  delay = 0
}: StatsCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}
      transition={{ delay }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">
            {title}
          </p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            <AnimatedNumber value={value} format={suffix !== '%'} />
            {suffix}
          </p>
          <div
            className={`flex items-center mt-2 text-sm font-medium ${
              trend === 'up'
                ? 'text-success'
                : 'text-red-600'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            <span>{trendValue}</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
          <Icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    </motion.div>
  );
}
