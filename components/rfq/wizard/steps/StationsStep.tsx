'use client';

import { SmartPasteStep } from './SmartPasteStep';
import { ManualEntryStep } from './ManualEntryStep';
import { FileUploadStep } from './FileUploadStep';

interface StationsStepProps {
  data: any;
  onChange: (data: any) => void;
}

export function StationsStep({ data, onChange }: StationsStepProps) {
  const inputMethod = data?.inputMethod || 'smart_paste';

  // Smart Paste (recommended default)
  if (inputMethod === 'smart_paste') {
    return <SmartPasteStep data={data} onChange={onChange} />;
  }

  // File Upload
  if (inputMethod === 'upload') {
    return <FileUploadStep data={data} onChange={onChange} />;
  }

  // Copy from Reference Model
  if (inputMethod === 'copy') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Copying from Reference Model
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Stations will be copied from the reference model you selected
        </p>
      </div>
    );
  }

  // Manual Entry (fallback)
  return <ManualEntryStep data={data} onChange={onChange} />;
}
