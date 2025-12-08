'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Settings,
  FileText,
  Plus,
  Package,
  X,
  Factory
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { slideInFromRightVariants } from '@/lib/animations';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Factory, label: 'Machines', href: '/machines' },
  { icon: Package, label: 'Models', href: '/models' },
];

const rfqItems = [
  { icon: Plus, label: 'New RFQ', href: '/rfq/new', highlight: true },
  { icon: FileText, label: 'RFQ History', href: '/rfq' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          <motion.aside
            variants={slideInFromRightVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 z-50 flex flex-col lg:hidden"
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Factory className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white">RFQ AI</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">System</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-3 py-4 overflow-y-auto">
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

              <nav className="space-y-1">
                {rfqItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          item.highlight && 'bg-primary-600 text-white hover:bg-primary-700',
                          !item.highlight && isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600'
                            : !item.highlight && 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="my-4 border-t border-slate-200 dark:border-slate-800" />

              <nav className="space-y-1">
                {bottomItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href} onClick={onClose}>
                      <div
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400">v1.0.0</span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
