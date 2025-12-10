"use client";

import { motion } from "framer-motion";
import { Check, X, Plus, Minus } from "lucide-react";
import { ExtractedStation } from "./ExtractedDataTable";
import { cn } from "@/lib/utils";
import { tableRowVariants } from "../animations/motion-variants";

interface ComparisonTableProps {
  queryStations: ExtractedStation[];
  modelStations: string[];
}

interface ComparisonRow {
  queryStation: string | null;
  modelStation: string | null;
  status: "match" | "missing" | "extra";
}

export function ComparisonTable({ queryStations, modelStations }: ComparisonTableProps) {
  // Build comparison rows
  const rows: ComparisonRow[] = [];
  const querySet = new Set(queryStations.map((s) => s.code.toUpperCase()));
  const modelSet = new Set(modelStations.map((s) => s.toUpperCase()));

  // Add matching and missing from query
  queryStations.forEach((station) => {
    const code = station.code.toUpperCase();
    if (modelSet.has(code)) {
      rows.push({ queryStation: station.code, modelStation: station.code, status: "match" });
    } else {
      rows.push({ queryStation: station.code, modelStation: null, status: "missing" });
    }
  });

  // Add extra from model
  modelStations.forEach((code) => {
    if (!querySet.has(code.toUpperCase())) {
      rows.push({ queryStation: null, modelStation: code, status: "extra" });
    }
  });

  // Sort: match first, then missing, then extra
  const order: Record<string, number> = { match: 0, missing: 1, extra: 2 };
  rows.sort((a, b) => order[a.status] - order[b.status]);

  const matchCount = rows.filter((r) => r.status === "match").length;
  const missingCount = rows.filter((r) => r.status === "missing").length;
  const extraCount = rows.filter((r) => r.status === "extra").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">{matchCount} Match</span>
        </div>
        <div className="flex items-center gap-2">
          <Minus className="h-4 w-4 text-red-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">{missingCount} Missing</span>
        </div>
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-blue-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">{extraCount} Extra</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                Your Stations
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-500 dark:text-slate-400">
                Model Stations
              </th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400 w-32">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <motion.tr
                key={index}
                custom={index}
                variants={tableRowVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  "border-t border-slate-200 dark:border-slate-700",
                  index % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-900/30" : "bg-white dark:bg-transparent"
                )}
              >
                <td className="px-4 py-3">
                  {row.queryStation ? (
                    <span className="font-mono text-slate-800 dark:text-white">{row.queryStation}</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.modelStation ? (
                    <span className="font-mono text-slate-800 dark:text-white">{row.modelStation}</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {row.status === "match" && (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-500">Match</span>
                      </>
                    )}
                    {row.status === "missing" && (
                      <>
                        <Minus className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-500">Missing in model</span>
                      </>
                    )}
                    {row.status === "extra" && (
                      <>
                        <Plus className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-500">Extra in model</span>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
