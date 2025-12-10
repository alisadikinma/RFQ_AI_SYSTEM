"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { Users, Gauge, Clock, DollarSign } from "lucide-react";
import { SimilarModel } from "./ModelCard";
import { fadeInUp, scaleIn } from "../animations/motion-variants";

interface InvestmentSummaryProps {
  model: SimilarModel;
}

// Cost calculation based on Batam standards (2025)
const BATAM_WAGE = 4_200_000; // IDR per month (UMK Batam 2025)
const OVERHEAD_MULTIPLIER = 1.35; // Include benefits, insurance, etc.
const EQUIPMENT_MONTHLY = 15_000_000; // Equipment depreciation estimate
const UTILITIES_MONTHLY = 8_500_000; // Utilities & overhead

export function InvestmentSummary({ model }: InvestmentSummaryProps) {
  // Calculate costs
  const laborCost = model.manpower * BATAM_WAGE * OVERHEAD_MULTIPLIER;
  const equipmentCost = EQUIPMENT_MONTHLY;
  const utilitiesCost = UTILITIES_MONTHLY;
  const totalMonthlyCost = laborCost + equipmentCost + utilitiesCost;

  // Calculate per unit cost (assuming 22 working days, 8 hours)
  const monthlyUnits = model.uph * 8 * 22;
  const costPerUnit = monthlyUnits > 0 ? totalMonthlyCost / monthlyUnits : 0;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          variants={scaleIn}
          className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30"
        >
          <Users className="h-8 w-8 text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            <CountUp end={model.manpower} duration={1.5} />
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Manpower</p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30"
        >
          <Gauge className="h-8 w-8 text-green-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            <CountUp end={model.uph} duration={1.5} />
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Units Per Hour</p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30"
        >
          <Clock className="h-8 w-8 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            <CountUp end={model.cycleTime || 240} duration={1.5} suffix="s" />
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cycle Time</p>
        </motion.div>

        <motion.div
          variants={scaleIn}
          className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30"
        >
          <DollarSign className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            <CountUp
              end={Math.round(costPerUnit)}
              duration={1.5}
              prefix="Rp "
              separator="."
            />
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Cost Per Unit</p>
        </motion.div>
      </div>

      {/* Cost Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800">
          <h3 className="font-semibold text-slate-800 dark:text-white">💰 Estimasi Biaya Bulanan</h3>
        </div>
        <div className="p-4 space-y-3 bg-white dark:bg-transparent">
          <CostRow
            label={`Labor Cost (${model.manpower} × Rp 4.2M × 1.35)`}
            value={laborCost}
            delay={0.5}
          />
          <CostRow
            label="Equipment Depreciation"
            value={equipmentCost}
            delay={0.6}
          />
          <CostRow
            label="Utilities & Overhead"
            value={utilitiesCost}
            delay={0.7}
          />
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
            <CostRow
              label="TOTAL"
              value={totalMonthlyCost}
              delay={0.8}
              isTotal
            />
          </div>
        </div>
      </motion.div>

      {/* Production Estimate */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
      >
        <h4 className="font-medium text-slate-800 dark:text-white mb-2">📊 Estimasi Produksi</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Per Hari (8 jam)</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">
              <CountUp end={model.uph * 8} duration={1.5} separator="." /> units
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Per Bulan (22 hari)</p>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">
              <CountUp end={monthlyUnits} duration={1.5} separator="." /> units
            </p>
          </div>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        * Estimasi berdasarkan UMK Batam 2025 (Rp 4.200.000). Biaya aktual dapat bervariasi.
      </p>
    </motion.div>
  );
}

// Cost Row Component
function CostRow({
  label,
  value,
  delay,
  isTotal = false,
}: {
  label: string;
  value: number;
  delay: number;
  isTotal?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center justify-between"
    >
      <span className={isTotal ? "font-semibold text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"}>
        {label}
      </span>
      <span className={isTotal ? "font-bold text-slate-800 dark:text-white text-lg" : "text-slate-700 dark:text-white"}>
        <CountUp
          end={value}
          duration={1}
          prefix="Rp "
          separator="."
          decimals={0}
        />
      </span>
    </motion.div>
  );
}
