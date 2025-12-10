"use client";

import { motion } from "framer-motion";
import { Users, Gauge, Clock, ChevronRight } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { cardVariants } from "../animations/motion-variants";
import { cn } from "@/lib/utils";

export interface BoardVariant {
  id: string;
  code: string;
  boardType: string;
  emmcSize?: string;
  ramSize?: string;
  investment: number;
  stationCount: number;
  manpower: number;
  uph?: number;
}

export interface SimilarModel {
  id: string;
  code: string;
  typeModel?: string;
  customerName: string;
  customerCode: string;
  similarity: number;
  // Aggregated totals
  totalStations?: number;
  totalManpower?: number;
  totalInvestment?: number;
  totalBoards?: number;
  // Station matching
  matchedStations: number | string[];
  missingStations?: string[];
  extraStations?: string[];
  allStations?: string[];
  // Board variants
  boards?: BoardVariant[];
  // Legacy compatibility
  stationCount?: number;
  manpower: number;
  uph: number;
  cycleTime?: number;
}

interface ModelCardProps {
  model: SimilarModel;
  rank: 1 | 2 | 3;
  index: number;
  onClick: () => void;
}

const rankConfig = {
  1: { emoji: "🥇", gradient: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/30" },
  2: { emoji: "🥈", gradient: "from-slate-400/20 to-slate-500/10", border: "border-slate-400/30" },
  3: { emoji: "🥉", gradient: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/30" },
};

export function ModelCard({ model, rank, index, onClick }: ModelCardProps) {
  const config = rankConfig[rank];

  // Get station count (support both formats)
  const stationCount = model.totalStations || model.stationCount || 0;
  const manpower = model.totalManpower || model.manpower || 0;
  const matchedCount = typeof model.matchedStations === 'number'
    ? model.matchedStations
    : model.matchedStations?.length || 0;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl border bg-gradient-to-br p-6 transition-colors",
        config.gradient,
        config.border,
        "hover:border-blue-500/50",
        "bg-white dark:bg-slate-800"
      )}
    >
      {/* Rank Badge */}
      <motion.div
        className="absolute -top-3 -left-3 text-3xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
      >
        {config.emoji}
      </motion.div>

      {/* Score Ring */}
      <div className="flex justify-center mb-4">
        <ScoreRing score={Math.round(model.similarity * 100)} size="md" />
      </div>

      {/* Model Info */}
      <div className="text-center mb-4">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          {model.customerName}
        </p>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white truncate">
          {model.code || model.typeModel}
        </h3>
        {model.totalBoards && model.totalBoards > 1 && (
          <p className="text-xs text-blue-500 mt-1">{model.totalBoards} boards</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
          <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{manpower}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">MP</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
          <Gauge className="h-4 w-4 text-green-500 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{model.uph}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">UPH</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
          <Clock className="h-4 w-4 text-purple-500 mx-auto mb-1" />
          <p className="text-sm font-semibold text-slate-800 dark:text-white">{stationCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Stations</p>
        </div>
      </div>

      {/* Match Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {matchedCount}/{stationCount} stations match
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.15), transparent 70%)",
        }}
      />
    </motion.div>
  );
}
