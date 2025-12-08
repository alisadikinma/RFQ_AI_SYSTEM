'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';

const processingSteps = [
  { id: 1, label: 'Validating input data', duration: 2000 },
  { id: 2, label: 'Mapping customer stations', duration: 2500 },
  { id: 3, label: 'Generating embeddings', duration: 3000 },
  { id: 4, label: 'Searching similar models...', duration: 4000 },
  { id: 5, label: 'Calculating investment', duration: 2000 },
  { id: 6, label: 'Generating recommendations', duration: 2500 },
];

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(18);

  useEffect(() => {
    const totalDuration = processingSteps.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    const stepTimer = setInterval(() => {
      if (currentStep < processingSteps.length) {
        elapsed += processingSteps[currentStep].duration;
        setProgress((elapsed / totalDuration) * 100);
        setCurrentStep((prev) => prev + 1);
        setTimeRemaining(Math.ceil((totalDuration - elapsed) / 1000));
      }
    }, processingSteps[currentStep]?.duration || 1000);

    if (currentStep >= processingSteps.length) {
      clearInterval(stepTimer);
      setTimeout(() => {
        router.push(`/rfq/${params.id}/results`);
      }, 1000);
    }

    return () => clearInterval(stepTimer);
  }, [currentStep, router, params.id]);

  const logoVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: { duration: 2, repeat: Infinity }
    }
  };

  const checkVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring' as any, damping: 15 }
    }
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: 'linear' as any }
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <motion.div
          variants={logoVariants}
          animate="animate"
          className="w-24 h-24 mb-8 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl"
        >
          <motion.div variants={spinnerVariants} animate="animate">
            <Loader2 className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-slate-900 dark:text-white mb-8"
        >
          Processing Your RFQ
        </motion.h2>

        <div className="w-full max-w-lg mb-8">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center mt-2 text-sm text-slate-600 dark:text-slate-400">
            {Math.round(progress)}%
          </p>
        </div>

        <div className="w-full max-w-lg space-y-3 mb-6">
          <AnimatePresence mode="popLayout">
            {processingSteps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isPending = index > currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  {isCompleted && (
                    <motion.div
                      variants={checkVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <motion.div variants={spinnerVariants} animate="animate">
                      <Loader2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                    </motion.div>
                  )}
                  {isPending && (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isCurrent
                        ? 'text-primary-700 dark:text-primary-300'
                        : isCompleted
                        ? 'text-success'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-slate-500"
        >
          Estimated time remaining: ~{timeRemaining} seconds
        </motion.p>
      </div>
    </PageTransition>
  );
}
