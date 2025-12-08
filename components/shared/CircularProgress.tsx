'use client';

import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

interface CircularProgressProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  delay?: number;
}

export function CircularProgress({
  score,
  size = 112,
  strokeWidth = 8,
  delay = 0.5
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const getColor = (s: number) => {
    if (s >= 80) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getGradient = (s: number) => {
    if (s >= 80) return { start: '#10b981', end: '#059669' };
    if (s >= 60) return { start: '#f59e0b', end: '#d97706' };
    return { start: '#ef4444', end: '#dc2626' };
  };

  const gradient = getGradient(score);
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient.start} />
            <stop offset="100%" stopColor={gradient.end} />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
          className="dark:stroke-slate-700"
        />

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (score / 100) * circumference
          }}
          transition={{
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1],
            delay
          }}
          strokeDasharray={circumference}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.5, duration: 0.3 }}
          className="text-center"
        >
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            <AnimatedNumber value={score} format={false} />%
          </div>
        </motion.div>
      </div>
    </div>
  );
}
