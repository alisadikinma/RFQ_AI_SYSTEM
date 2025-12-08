'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const stepCircleVariants = {
    inactive: { scale: 1, backgroundColor: '#e5e7eb' },
    active: { scale: 1.1, backgroundColor: '#3b82f6' },
    completed: { scale: 1, backgroundColor: '#10b981' },
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1 relative">
            <motion.button
              onClick={() => onStepClick(index)}
              disabled={index > currentStep}
              className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold disabled:cursor-not-allowed"
              variants={stepCircleVariants}
              initial="inactive"
              animate={
                index < currentStep
                  ? 'completed'
                  : index === currentStep
                  ? 'active'
                  : 'inactive'
              }
              whileHover={index <= currentStep ? { scale: 1.15 } : {}}
              whileTap={index <= currentStep ? { scale: 0.95 } : {}}
            >
              {index < currentStep ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Check className="w-5 h-5" />
                </motion.div>
              ) : (
                <span className={index === currentStep ? 'text-white' : 'text-slate-400'}>
                  {index + 1}
                </span>
              )}
            </motion.button>

            <div className="mt-2 text-center">
              <p
                className={`text-sm font-medium ${
                  index === currentStep
                    ? 'text-slate-900 dark:text-white'
                    : index < currentStep
                    ? 'text-success'
                    : 'text-slate-400'
                }`}
              >
                {step}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
        <motion.div
          className="h-full bg-primary-600"
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
        />
      </div>
    </div>
  );
}
