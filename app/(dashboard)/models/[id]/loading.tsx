export default function ModelDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div>
            <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between">
          <div className="space-y-3">
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="flex gap-2">
              <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-7 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-7 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stations table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="flex-1" />
              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
