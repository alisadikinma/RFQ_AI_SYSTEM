"use client";

import { motion } from "framer-motion";
import { ModelCard, SimilarModel } from "./ModelCard";
import { staggerContainer, fadeInUp } from "../animations/motion-variants";
import { Sparkles } from "lucide-react";

interface SimilarModelCardsProps {
  models: SimilarModel[];
  onSelectModel: (model: SimilarModel) => void;
}

export function SimilarModelCards({ models, onSelectModel }: SimilarModelCardsProps) {
  // Take top 3 models
  const topModels = models.slice(0, 3);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </motion.div>
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-white">Model Serupa Ditemukan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Top 3 model dengan similarity tertinggi
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {topModels.map((model, index) => (
          <ModelCard
            key={model.id}
            model={model}
            rank={(index + 1) as 1 | 2 | 3}
            index={index}
            onClick={() => onSelectModel(model)}
          />
        ))}
      </motion.div>

      {/* Additional Results Note */}
      {models.length > 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-slate-500 dark:text-slate-400 text-center"
        >
          +{models.length - 3} model lainnya tersedia
        </motion.p>
      )}
    </motion.div>
  );
}
