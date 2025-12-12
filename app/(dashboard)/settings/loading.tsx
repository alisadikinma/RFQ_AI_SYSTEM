import { Loader2 } from 'lucide-react';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2 animate-pulse" />
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
