'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Scissors,
  Droplets,
  Thermometer,
  Eye,
  Truck,
  Building2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UMK_BATAM = 4989600;

interface ProcessQuestion {
  id: string;
  question: string;
  questionId: string;
  icon: React.ElementType;
  color: string;
  options?: { id: string; label: string; manpower: number; investment: number }[];
  manpower?: number;
  investment?: number;
}

const QUESTIONS: ProcessQuestion[] = [
  {
    id: 'printing_isn',
    question: 'Printing ISN Number?',
    questionId: 'Cetak Nomor ISN?',
    icon: Zap,
    color: 'violet',
    options: [
      { id: 'laser', label: 'Laser', manpower: 0.3, investment: 13500 },
      { id: 'label', label: 'Label', manpower: 0.2, investment: 3000 },
    ],
  },
  {
    id: 'router',
    question: 'Router Machine?',
    questionId: 'Mesin Router?',
    icon: Scissors,
    color: 'blue',
    manpower: 1.0,
    investment: 50000,
  },
  {
    id: 'underfill',
    question: 'Underfill Process?',
    questionId: 'Proses Underfill?',
    icon: Droplets,
    color: 'cyan',
    manpower: 1.5,
    investment: 27000,
  },
  {
    id: 'thermal_glue',
    question: 'Thermal & Glue?',
    questionId: 'Thermal & Lem?',
    icon: Thermometer,
    color: 'orange',
    manpower: 0.5,
    investment: 9000,
  },
  {
    id: 'visual',
    question: 'Visual Inspection?',
    questionId: 'Inspeksi Visual?',
    icon: Eye,
    color: 'emerald',
    manpower: 1.5,
    investment: 2500,
  },
  {
    id: 'shipment',
    question: 'Shipment Type?',
    questionId: 'Tipe Pengiriman?',
    icon: Truck,
    color: 'rose',
    options: [
      { id: 'internal', label: 'FATP', manpower: 0.2, investment: 0 },
      { id: 'external', label: 'External', manpower: 0.3, investment: 0 },
    ],
  },
];

const COLORS: Record<string, string> = {
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
};

interface QuickProcessFormProps {
  onComplete: (data: {
    selections: Record<string, boolean | string>;
    totalManpower: number;
    totalInvestment: number;
    monthlyLaborCost: number;
  }) => void;
}

export function QuickProcessForm({ onComplete }: QuickProcessFormProps) {
  const [answers, setAnswers] = useState<Record<string, boolean | string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleAnswer = (answer: boolean | string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: answer };
    setAnswers(newAnswers);

    if (currentIndex < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      setIsComplete(true);
      calculateAndSubmit(newAnswers);
    }
  };

  const calculateAndSubmit = (finalAnswers: Record<string, boolean | string>) => {
    let totalManpower = 0;
    let totalInvestment = 0;

    QUESTIONS.forEach((q) => {
      const answer = finalAnswers[q.id];
      if (!answer) return;

      if (q.options && typeof answer === 'string') {
        const option = q.options.find((o) => o.id === answer);
        if (option) {
          totalManpower += option.manpower;
          totalInvestment += option.investment;
        }
      } else if (answer === true && q.manpower) {
        totalManpower += q.manpower;
        totalInvestment += q.investment || 0;
      }
    });

    setTimeout(() => {
      setShowSummary(true);
      onComplete({
        selections: finalAnswers,
        totalManpower,
        totalInvestment,
        monthlyLaborCost: totalManpower * UMK_BATAM,
      });
    }, 500);
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (showSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 p-4"
      >
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">Proses tambahan telah dicatat!</span>
        </div>
      </motion.div>
    );
  }

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
        <span className="ml-2 text-slate-600 dark:text-slate-400">Menghitung investasi...</span>
      </motion.div>
    );
  }

  const Icon = currentQuestion.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg"
    >
      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
        />
      </div>

      {/* Question content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Pertanyaan {currentIndex + 1} dari {QUESTIONS.length}</span>
          </div>
          {currentIndex > 0 && (
            <button
              onClick={goBack}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
            >
              <ChevronUp className="w-3 h-3" />
              Kembali
            </button>
          )}
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white', COLORS[currentQuestion.color])}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {currentQuestion.question}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentQuestion.questionId}
                </p>
              </div>
            </div>

            {/* Answer buttons */}
            <div className="flex gap-2">
              {currentQuestion.options ? (
                <>
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(option.id)}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all',
                        'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600',
                        'hover:border-slate-400 dark:hover:border-slate-500',
                        'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {option.label}
                      {option.investment > 0 && (
                        <span className="block text-xs text-slate-500 mt-1">
                          ${(option.investment / 1000).toFixed(0)}K
                        </span>
                      )}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(false)}
                    className="py-3 px-4 rounded-lg border-2 border-slate-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(true)}
                    className="flex-1 py-3 px-4 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Check className="w-5 h-5" />
                    Ya
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(false)}
                    className="flex-1 py-3 px-4 rounded-lg border-2 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <X className="w-5 h-5" />
                    Tidak
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
