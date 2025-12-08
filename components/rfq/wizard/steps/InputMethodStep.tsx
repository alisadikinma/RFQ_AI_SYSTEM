'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InputMethodStepProps {
  data: any;
  onChange: (data: any) => void;
  hasReferenceModel: boolean;
}

export function InputMethodStep({
  data,
  onChange,
  hasReferenceModel,
}: InputMethodStepProps) {
  const [selectedMethod, setSelectedMethod] = useState(
    data?.inputMethod || 'manual'
  );

  useEffect(() => {
    onChange({ inputMethod: selectedMethod });
  }, [selectedMethod]);

  const methods = [
    {
      id: 'manual',
      icon: FileText,
      title: 'Manual Entry',
      description: 'Enter stations one by one with details',
    },
    {
      id: 'upload',
      icon: Upload,
      title: 'Upload File',
      description: 'Upload Excel/PDF with station list',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          How would you like to provide station information?
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <motion.button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={
                isSelected
                  ? {
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    }
                  : {}
              }
              className={`relative border-2 rounded-xl p-8 cursor-pointer text-center transition-colors ${
                isSelected
                  ? 'border-primary-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 ${
                      isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-400'
                    }`}
                  />
                </motion.div>

                <div>
                  <h4
                    className={`text-lg font-semibold mb-1 ${
                      isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {method.title}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {method.description}
                  </p>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center"
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {hasReferenceModel && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-slate-800 text-slate-500">
                OR
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="outline"
              className="w-full h-14 gap-2 text-base"
              onClick={() => setSelectedMethod('copy')}
            >
              <Copy className="w-5 h-5" />
              Copy from Reference Model
            </Button>
            <p className="text-sm text-slate-500 text-center mt-2">
              Use station list from the reference model you selected
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
