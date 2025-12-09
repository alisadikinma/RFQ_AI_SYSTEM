export default function RFQLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-5 w-72 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
      
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-40 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="w-40 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="flex-1" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
