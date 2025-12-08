'use client';

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepIndicator } from './StepIndicator';
import { StepNavigation } from './StepNavigation';

interface WizardStep {
  title: string;
  component: ReactNode;
}

interface WizardContainerProps {
  steps: WizardStep[];
  onComplete: (data: any) => void;
  initialData?: any;
}

export function WizardContainer({ steps, onComplete, initialData = {} }: WizardContainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex < currentStep) {
      setDirection(-1);
      setCurrentStep(stepIndex);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Saving draft:', formData);
    setIsSaving(false);
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const updateFormData = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
  };

  const stepContentVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      transition: { duration: 0.2 },
    }),
  };

  return (
    <div className="space-y-8">
      <StepIndicator
        steps={steps.map(s => s.title)}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
              {steps[currentStep].component}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <StepNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onBack={handleBack}
        onNext={handleNext}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        canGoNext={true}
      />
    </div>
  );
}
