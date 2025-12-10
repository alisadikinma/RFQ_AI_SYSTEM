"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface ProcessingStep {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  currentStep: number;
}

export function ProcessingSteps({ steps, currentStep }: ProcessingStepsProps) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-colors",
              isCurrent && "bg-blue-500/10 border border-blue-500/30",
              isCompleted && "opacity-70"
            )}
          >
            {/* Status Icon */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isCompleted && "bg-green-500",
                isCurrent && "bg-blue-500",
                isPending && "bg-zinc-700"
              )}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Check className="h-4 w-4 text-white" />
                </motion.div>
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : (
                <step.icon className="h-4 w-4 text-zinc-400" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent && "text-white",
                  isCompleted && "text-zinc-400",
                  isPending && "text-zinc-500"
                )}
              >
                {step.label}
              </p>
              {step.description && isCurrent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-zinc-400"
                >
                  {step.description}
                </motion.p>
              )}
            </div>

            {/* Duration indicator for current step */}
            {isCurrent && (
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
