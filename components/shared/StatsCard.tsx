'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { cardHoverVariants, itemVariants } from '@/lib/animations';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  suffix?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, suffix = '' }: StatsCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold text-slate-900 dark:text-white">
              <AnimatedNumber value={value} />
              {suffix}
            </h3>
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive
                    ? 'text-success'
                    : 'text-error'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}
                {typeof trend.value === 'number' && trend.value % 1 !== 0 ? '%' : ''}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                vs last period
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    </motion.div>
  );
}
