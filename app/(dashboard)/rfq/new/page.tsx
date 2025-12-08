'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { WizardContainer } from '@/components/rfq/wizard/WizardContainer';
import { CustomerInfoStep } from '@/components/rfq/wizard/steps/CustomerInfoStep';
import { InputMethodStep } from '@/components/rfq/wizard/steps/InputMethodStep';
import { StationsStep } from '@/components/rfq/wizard/steps/StationsStep';
import { ReviewStep } from '@/components/rfq/wizard/steps/ReviewStep';

export default function NewRFQPage() {
  const router = useRouter();
  const [wizardData, setWizardData] = useState<any>({});

  const handleComplete = (data: any) => {
    console.log('RFQ Data:', data);
    toast.success('RFQ submitted successfully!');

    setTimeout(() => {
      router.push('/rfq');
    }, 1500);
  };

  const handleStepChange = (stepData: any) => {
    setWizardData({ ...wizardData, ...stepData });
  };

  const handleEditStep = (stepIndex: number) => {
    console.log('Edit step:', stepIndex);
  };

  const steps = [
    {
      title: 'Customer Info',
      component: (
        <CustomerInfoStep data={wizardData} onChange={handleStepChange} />
      ),
    },
    {
      title: 'Input Method',
      component: (
        <InputMethodStep
          data={wizardData}
          onChange={handleStepChange}
          hasReferenceModel={!!wizardData.referenceModel}
        />
      ),
    },
    {
      title: 'Stations',
      component: <StationsStep data={wizardData} onChange={handleStepChange} />,
    },
    {
      title: 'Review',
      component: <ReviewStep data={wizardData} onEdit={handleEditStep} />,
    },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            New RFQ Request
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create a new RFQ request with AI-powered station mapping
          </p>
        </div>

        <WizardContainer
          steps={steps}
          onComplete={handleComplete}
          initialData={wizardData}
        />
      </div>
    </PageTransition>
  );
}
