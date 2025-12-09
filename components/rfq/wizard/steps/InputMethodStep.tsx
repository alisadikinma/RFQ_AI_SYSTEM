'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, Copy, ClipboardPaste, Sparkles, Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    data?.inputMethod || 'smart_paste'
  );

  useEffect(() => {
    onChange({ inputMethod: selectedMethod });
  }, [selectedMethod]);

  const methods = [
    {
      id: 'smart_paste',
      icon: ClipboardPaste,
      title: 'Smart Paste',
      description: 'Paste from Excel with auto-detection',
      badge: 'Recommended',
      badgeVariant: 'default' as const,
    },
    {
      id: 'ai_assistant',
      icon: Bot,
      title: 'AI Assistant',
      description: 'Chat with AI to determine stations',
      badge: 'New',
      badgeVariant: 'secondary' as const,
      badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    },
    {
      id: 'manual',
      icon: FileText,
      title: 'Manual Entry',
      description: 'Enter stations one by one',
      badge: null,
      badgeVariant: 'secondary' as const,
    },
    {
      id: 'upload',
      icon: Upload,
      title: 'Upload File',
      description: 'Upload Excel/PDF file',
      badge: null,
      badgeVariant: 'secondary' as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          How would you like to provide station information?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose your preferred method to input station data
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              className={`relative border-2 rounded-xl p-6 cursor-pointer text-center transition-colors ${
                isSelected
                  ? 'border-primary-500'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                {method.badge && (
                  <Badge
                    variant={method.badgeVariant}
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs ${(method as any).badgeClass || ''}`}
                  >
                    {method.id === 'ai_assistant' ? (
                      <MessageSquare className="w-3 h-3 mr-1" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    {method.badge}
                  </Badge>
                )}

                <motion.div
                  animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    isSelected
                      ? 'bg-primary-100 dark:bg-primary-900/30'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <Icon
                    className={`w-7 h-7 ${
                      isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-400'
                    }`}
                  />
                </motion.div>

                <div>
                  <h4
                    className={`text-base font-semibold mb-1 ${
                      isSelected
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {method.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {method.description}
                  </p>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Smart Paste Features */}
      {selectedMethod === 'smart_paste' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800"
        >
          <h4 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
            Smart Paste Features
          </h4>
          <ul className="text-sm text-primary-600 dark:text-primary-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Auto-detects Excel table structure
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Multi-language support (Chinese, English, Indonesian)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              Automatic column mapping
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
              AI-powered station name resolution
            </li>
          </ul>
        </motion.div>
      )}

      {/* AI Assistant Features */}
      {selectedMethod === 'ai_assistant' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800"
        >
          <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Assistant Features
          </h4>
          <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Natural language conversation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Automatic station inference from product description
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Knowledge of 38+ standard test stations
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Product type templates (smartphone, IoT, wearable, etc.)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Similar model search directly from chat
            </li>
          </ul>
          <p className="text-xs text-amber-500 dark:text-amber-500 mt-3">
            💡 Ideal for users who are unsure about required stations
          </p>
        </motion.div>
      )}

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
