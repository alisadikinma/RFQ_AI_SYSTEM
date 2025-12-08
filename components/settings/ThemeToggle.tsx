'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  if (!mounted) return null;

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' }
  ];

  return (
    <div className="flex gap-3">
      {themes.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setTheme(value)}
          className={`
            relative px-6 py-4 rounded-xl border-2 transition-all
            ${
              theme === value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }
          `}
        >
          {theme === value && (
            <motion.div
              layoutId="activeTheme"
              className="absolute inset-0 border-2 border-primary-500 rounded-xl"
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            />
          )}
          <div className="relative flex flex-col items-center gap-2">
            <Icon className={`w-6 h-6 ${theme === value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400'}`} />
            <span className={`text-sm font-medium ${theme === value ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
              {label}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
