'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CapacityChartProps {
  data: any[];
}

export function CapacityChart({ data }: CapacityChartProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
        📊 Station Capacity Analysis
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} />
          <YAxis dataKey="station" type="category" width={80} />
          <Tooltip
            content={({ payload }) => {
              if (!payload || !payload[0]) return null;
              const data = payload[0].payload;
              return (
                <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl">
                  <p className="font-medium">{data.station}</p>
                  <p className="text-sm">{data.utilization}% utilization</p>
                  <p className="text-sm text-slate-300">{data.uph} UPH</p>
                  {data.isBottleneck && (
                    <p className="text-sm text-red-400 mt-1">⚠️ Bottleneck</p>
                  )}
                </div>
              );
            }}
          />
          <Bar
            dataKey="utilization"
            radius={[0, 4, 4, 0]}
            animationDuration={1000}
            animationBegin={200}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.isBottleneck
                    ? '#ef4444'
                    : entry.utilization > 80
                    ? '#f59e0b'
                    : '#10b981'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span className="text-slate-600 dark:text-slate-400">
            Healthy (&lt;80%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Warning (80-99%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-slate-600 dark:text-slate-400">
            Bottleneck (100%)
          </span>
        </div>
      </div>
    </div>
  );
}
