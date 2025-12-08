'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  canGoNext: boolean;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSaveDraft,
  onSubmit,
  isSaving,
  canGoNext,
}: StepNavigationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const isLastStep = currentStep === totalSteps - 1;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitSuccess(true);

    setTimeout(() => {
      onSubmit();
    }, 500);
  };

  const submitButtonVariants = {
    idle: { width: 'auto' },
    loading: {
      width: 56,
      transition: { duration: 0.3 },
    },
    success: {
      backgroundColor: '#10b981',
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <Button
        variant="outline"
        onClick={onSaveDraft}
        disabled={isSaving}
        className="gap-2"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Save Draft
      </Button>

      <div className="flex items-center gap-3">
        {currentStep > 0 && (
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}

        {isLastStep ? (
          <motion.div
            variants={submitButtonVariants}
            animate={
              submitSuccess ? 'success' : isSubmitting ? 'loading' : 'idle'
            }
          >
            <Button
              onClick={handleSubmit}
              disabled={!canGoNext || isSubmitting || submitSuccess}
              className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 min-w-[120px]"
            >
              {submitSuccess ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Submit RFQ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canGoNext}
            className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
