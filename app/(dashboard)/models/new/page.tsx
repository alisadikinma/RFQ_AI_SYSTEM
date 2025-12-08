'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Loader2, CheckCircle2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { ModelInfoStep } from '@/components/models/wizard/steps/ModelInfoStep';
import { StationsConfigStep } from '@/components/models/wizard/steps/StationsConfigStep';
import { ModelReviewStep } from '@/components/models/wizard/steps/ModelReviewStep';
import { createModel, type ModelInput, type ModelStationInput } from '@/lib/api/models';

interface Station {
  id: string;
  machineId: string;
  manpower: number;
}

interface WizardData {
  code?: string;
  name?: string;
  customerId?: string;
  status?: 'active' | 'inactive';
  boardTypes?: string[];
  stations?: Record<string, Station[]>;
}

const STEPS = ['Model Info', 'Stations', 'Review'];

export default function NewModelPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    status: 'active',
    boardTypes: [],
    stations: {},
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleStepChange = (data: Partial<WizardData>) => {
    setWizardData({ ...wizardData, ...data });
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
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

  const handleEditStep = (stepIndex: number) => {
    setDirection(-1);
    setCurrentStep(stepIndex);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    // In a real app, you'd save to local storage or database
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.info('Draft saved locally');
    setIsSaving(false);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return !!(wizardData.code && wizardData.name && wizardData.customerId && (wizardData.boardTypes?.length || 0) > 0);
      case 1:
        const boardTypes = wizardData.boardTypes || [];
        const stations = wizardData.stations || {};
        return boardTypes.every(type => {
          const typeStations = stations[type] || [];
          return typeStations.length > 0 && typeStations.every(s => s.machineId);
        });
      case 2:
        return canSubmit();
      default:
        return false;
    }
  };

  const canSubmit = () => {
    if (!wizardData.code || !wizardData.name || !wizardData.customerId) return false;
    const boardTypes = wizardData.boardTypes || [];
    if (boardTypes.length === 0) return false;
    const stations = wizardData.stations || {};
    return boardTypes.every(type => {
      const typeStations = stations[type] || [];
      return typeStations.length > 0 && typeStations.every(s => s.machineId);
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare model data
      const modelInput: ModelInput = {
        customer_id: wizardData.customerId!,
        code: wizardData.code!,
        name: wizardData.name!,
        status: wizardData.status || 'active',
        board_types: wizardData.boardTypes || [],
      };

      // Prepare stations data
      const stationsInput: ModelStationInput[] = [];
      const boardTypes = wizardData.boardTypes || [];
      const stations = wizardData.stations || {};

      boardTypes.forEach(boardType => {
        const typeStations = stations[boardType] || [];
        typeStations.forEach((station, index) => {
          stationsInput.push({
            model_id: '', // Will be set by the API
            board_type: boardType,
            machine_id: station.machineId,
            sequence: index + 1,
            manpower: station.manpower,
          });
        });
      });

      await createModel(modelInput, stationsInput);

      setSubmitSuccess(true);
      toast.success('Model created successfully!');

      setTimeout(() => {
        router.push('/models');
      }, 1000);
    } catch (error: any) {
      console.error('Failed to create model:', error);
      toast.error(error.message || 'Failed to create model');
      setIsSubmitting(false);
    }
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

  const stepCircleVariants = {
    inactive: { scale: 1, backgroundColor: '#e5e7eb' },
    active: { scale: 1.1, backgroundColor: '#3b82f6' },
    completed: { scale: 1, backgroundColor: '#10b981' },
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <ModelInfoStep data={wizardData} onChange={handleStepChange} />;
      case 1:
        return <StationsConfigStep data={wizardData} onChange={handleStepChange} />;
      case 2:
        return <ModelReviewStep data={wizardData} onEdit={handleEditStep} />;
      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Create New Model
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Configure a new production model with station flow
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1 relative">
                <motion.button
                  onClick={() => handleStepClick(index)}
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
                width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
            />
          </div>
        </div>

        {/* Step Content */}
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
                {renderStepContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
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
              <Button variant="outline" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit() || isSubmitting || submitSuccess}
                className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 min-w-[140px]"
              >
                {submitSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Success!
                  </>
                ) : isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Model
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
