'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ProcessingIndicatorProps {
  step?: string | null;
  className?: string;
}

export function ProcessingIndicator({ step, className }: ProcessingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 bg-muted/50 rounded-lg animate-pulse',
        className
      )}
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {step || 'Processing...'}
        </p>
        <div className="flex gap-1 mt-1">
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
