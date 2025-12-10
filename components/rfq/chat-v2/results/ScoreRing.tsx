"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 60, stroke: 4, fontSize: "text-sm" },
  md: { width: 80, stroke: 5, fontSize: "text-lg" },
  lg: { width: 100, stroke: 6, fontSize: "text-2xl" },
};

export function ScoreRing({ score, size = "md", showLabel = true, className }: ScoreRingProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.4)" };
    if (score >= 60) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" };
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const colors = getColor();

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Glow effect */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.width,
          height: config.width,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
        animate={{
          boxShadow: [
            `0 0 10px ${colors.glow}`,
            `0 0 25px ${colors.glow}`,
            `0 0 10px ${colors.glow}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* SVG Ring */}
      <svg width={config.width} height={config.width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          className="text-slate-200 dark:text-slate-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={config.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>

      {/* Score Text */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-slate-800 dark:text-white", config.fontSize)}>
            <CountUp end={score} duration={1.5} suffix="%" />
          </span>
        </div>
      )}
    </div>
  );
}
