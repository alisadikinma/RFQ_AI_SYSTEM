"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ProcessingSteps, ProcessingStep } from "./ProcessingSteps";
import { Brain } from "lucide-react";
import { useEffect, useState } from "react";

interface ProcessingOverlayProps {
  isVisible: boolean;
  currentStep: number;
  steps: ProcessingStep[];
}

export function ProcessingOverlay({ isVisible, currentStep, steps }: ProcessingOverlayProps) {
  const [particles, setParticles] = useState<{ x: number; y: number; delay: number }[]>([]);

  // Generate random particles on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const newParticles = [...Array(20)].map(() => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          {/* Animated Background Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((particle, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-500/30 rounded-full"
                initial={{
                  x: particle.x,
                  y: particle.y,
                  scale: 0,
                }}
                animate={{
                  y: [null, particle.y - 300 - Math.random() * 200],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: particle.delay,
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative z-10 max-w-md w-full mx-4"
          >
            {/* Glowing Card */}
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 animate-pulse" />

              {/* Card Content */}
              <div className="relative bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
                {/* AI Brain Animation */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    className="relative"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    {/* Orbiting particles */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 bg-blue-500 rounded-full"
                        style={{
                          top: "50%",
                          left: "50%",
                          marginTop: -6,
                          marginLeft: -6,
                        }}
                        animate={{
                          x: [0, 40 * Math.cos((i * 120 * Math.PI) / 180)],
                          y: [0, 40 * Math.sin((i * 120 * Math.PI) / 180)],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: i * 0.3,
                        }}
                      />
                    ))}

                    {/* Center brain icon */}
                    <motion.div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Brain className="h-8 w-8 md:h-10 md:w-10 text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Title */}
                <motion.h2
                  className="text-xl font-bold text-white text-center mb-2"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI Agent Sedang Bekerja
                </motion.h2>
                <p className="text-zinc-400 text-center text-sm mb-6">
                  Menganalisis data dengan kecerdasan buatan
                </p>

                {/* Processing Steps */}
                <ProcessingSteps steps={steps} currentStep={currentStep} />

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 text-center mt-2">
                    Step {currentStep + 1} dari {steps.length}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
