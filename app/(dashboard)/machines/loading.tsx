import { Loader2 } from 'lucide-react';

export default function MachinesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4">
            <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-48 h-10 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="flex-1" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
