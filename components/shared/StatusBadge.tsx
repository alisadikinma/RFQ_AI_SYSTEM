'use client';

import { CheckCircle2, Clock, FileEdit, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'completed' | 'processing' | 'draft' | 'failed';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
  },
  draft: {
    label: 'Draft',
    icon: FileEdit,
    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
  }
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon
        className={cn(
          'w-3.5 h-3.5',
          status === 'processing' && 'animate-spin',
          status === 'failed' && 'animate-pulse'
        )}
      />
      {config.label}
    </span>
  );
}
