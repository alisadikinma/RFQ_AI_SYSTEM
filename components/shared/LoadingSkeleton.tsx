import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function LoadingSkeleton({ className, variant = 'rectangular' }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700',
        'bg-[length:200%_100%] animate-shimmer',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
      )}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <LoadingSkeleton variant="text" className="w-24" />
          <LoadingSkeleton variant="text" className="w-32 h-8" />
          <LoadingSkeleton variant="text" className="w-20" />
        </div>
        <LoadingSkeleton variant="circular" className="w-12 h-12" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-200 dark:border-slate-700">
      <LoadingSkeleton variant="text" className="w-24" />
      <LoadingSkeleton variant="text" className="w-32" />
      <LoadingSkeleton variant="text" className="w-40" />
      <LoadingSkeleton variant="text" className="w-20" />
      <LoadingSkeleton variant="text" className="w-16" />
    </div>
  );
}
