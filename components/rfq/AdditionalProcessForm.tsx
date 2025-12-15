'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Tag,
  Scissors,
  Droplets,
  Thermometer,
  Eye,
  Truck,
  Building2,
  ChevronRight,
  Sparkles,
  Calculator,
  Users,
  DollarSign,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Process definitions with costs based on formulas
const PROCESSES = [
  {
    id: 'printing_isn',
    code: 'PRINTING_ISN',
    name: 'Printing ISN Number',
    nameId: 'Cetak Nomor ISN',
    description: 'Serial number marking for traceability',
    icon: Zap,
    color: 'violet',
    options: [
      { id: 'laser', label: 'Laser Marking', labelId: 'Laser', cycleTime: 8, manpower: 0.3, investment: 13500 },
      { id: 'label', label: 'Label/Sticker', labelId: 'Label', cycleTime: 5, manpower: 0.2, investment: 3000 },
    ],
  },
  {
    id: 'router',
    code: 'ROUTER',
    name: 'Router Machine',
    nameId: 'Mesin Router',
    description: 'PCB depaneling after SMT process',
    icon: Scissors,
    color: 'blue',
    cycleTime: 25,
    manpower: 1.0,
    investment: 50000,
  },
  {
    id: 'underfill',
    code: 'UNDERFILL',
    name: 'Underfill Process',
    nameId: 'Proses Underfill',
    description: 'Epoxy reinforcement for BGA/CSP',
    icon: Droplets,
    color: 'cyan',
    cycleTime: 45,
    manpower: 1.5,
    investment: 27000,
  },
  {
    id: 'thermal_glue',
    code: 'THERMAL_GLUE',
    name: 'Thermal & Glue',
    nameId: 'Thermal & Lem',
    description: 'Thermal paste and adhesive application',
    icon: Thermometer,
    color: 'orange',
    cycleTime: 15,
    manpower: 0.5,
    investment: 9000,
  },
  {
    id: 'visual',
    code: 'VISUAL',
    name: 'Visual Inspection',
    nameId: 'Inspeksi Visual',
    description: 'Manual quality inspection station',
    icon: Eye,
    color: 'emerald',
    cycleTime: 45,
    manpower: 1.5,
    investment: 2500,
  },
  {
    id: 'shipment',
    code: 'SHIPMENT',
    name: 'Shipment Type',
    nameId: 'Tipe Pengiriman',
    description: 'Delivery destination affects handling cost',
    icon: Truck,
    color: 'rose',
    options: [
      { id: 'internal', label: 'Internal (FATP)', labelId: 'Internal (FATP)', manpower: 0.2, investment: 0, icon: Building2 },
      { id: 'external', label: 'External Customer', labelId: 'Eksternal', manpower: 0.3, investment: 0, icon: Truck },
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-300 dark:border-violet-700',
    text: 'text-violet-600 dark:text-violet-400',
    glow: 'shadow-violet-200 dark:shadow-violet-900/50',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    glow: 'shadow-blue-200 dark:shadow-blue-900/50',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-300 dark:border-cyan-700',
    text: 'text-cyan-600 dark:text-cyan-400',
    glow: 'shadow-cyan-200 dark:shadow-cyan-900/50',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    text: 'text-orange-600 dark:text-orange-400',
    glow: 'shadow-orange-200 dark:shadow-orange-900/50',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-300 dark:border-emerald-700',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'shadow-emerald-200 dark:shadow-emerald-900/50',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-300 dark:border-rose-700',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'shadow-rose-200 dark:shadow-rose-900/50',
  },
};

// UMK Batam 2025
const UMK_BATAM = 4989600;

interface ProcessSelection {
  [key: string]: boolean | string; // boolean for simple toggle, string for option selection
}

interface AdditionalProcessFormProps {
  targetUPH?: number;
  onSubmit: (data: {
    selections: ProcessSelection;
    totalManpower: number;
    totalInvestment: number;
    monthlyLaborCost: number;
  }) => void;
  onSkip?: () => void;
}

export function AdditionalProcessForm({ 
  targetUPH = 100, 
  onSubmit,
  onSkip 
}: AdditionalProcessFormProps) {
  const [selections, setSelections] = useState<ProcessSelection>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate totals based on selections
  const calculateTotals = () => {
    let totalManpower = 0;
    let totalInvestment = 0;

    PROCESSES.forEach((process) => {
      const selection = selections[process.id];
      
      if (!selection) return;

      if (process.options) {
        // Has options (printing_isn, shipment)
        const selectedOption = process.options.find((opt) => opt.id === selection);
        if (selectedOption) {
          totalManpower += selectedOption.manpower;
          totalInvestment += selectedOption.investment;
        }
      } else if (selection === true) {
        // Simple toggle
        totalManpower += process.manpower || 0;
        totalInvestment += process.investment || 0;
      }
    });

    const monthlyLaborCost = totalManpower * UMK_BATAM;

    return { totalManpower, totalInvestment, monthlyLaborCost };
  };

  const { totalManpower, totalInvestment, monthlyLaborCost } = calculateTotals();
  const hasSelections = Object.values(selections).some((v) => v);

  const handleToggle = (processId: string) => {
    setSelections((prev) => ({
      ...prev,
      [processId]: !prev[processId],
    }));
  };

  const handleOptionSelect = (processId: string, optionId: string) => {
    setSelections((prev) => ({
      ...prev,
      [processId]: prev[processId] === optionId ? undefined : optionId,
    }));
  };

  const handleSubmit = async () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for effect
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    onSubmit({
      selections,
      totalManpower,
      totalInvestment,
      monthlyLaborCost,
    });
    
    setIsCalculating(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 mb-3">
          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            Additional Process Check
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Apakah model ini memerlukan proses tambahan?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pilih proses yang diperlukan untuk kalkulasi investasi yang akurat
        </p>
      </motion.div>

      {/* Process Cards */}
      <div className="space-y-3 mb-6">
        {PROCESSES.map((process, index) => {
          const colors = COLOR_MAP[process.color];
          const isSelected = !!selections[process.id];
          const Icon = process.icon;

          return (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div
                className={cn(
                  'relative rounded-xl border-2 p-4 transition-all duration-300 cursor-pointer',
                  isSelected
                    ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                {/* Main content */}
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                      isSelected
                        ? `${colors.bg} ${colors.text}`
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {process.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({process.nameId})
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {process.description}
                    </p>

                    {/* Options or Toggle */}
                    {process.options ? (
                      <div className="flex flex-wrap gap-2">
                        {process.options.map((option) => {
                          const isOptionSelected = selections[process.id] === option.id;
                          const OptionIcon = option.icon || process.icon;
                          
                          return (
                            <motion.button
                              key={option.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOptionSelect(process.id, option.id);
                              }}
                              className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-200',
                                isOptionSelected
                                  ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                                  : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                              )}
                            >
                              {isOptionSelected ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                              <span className="text-sm">{option.label}</span>
                              {option.investment > 0 && (
                                <span className="text-xs opacity-70">
                                  ${(option.investment / 1000).toFixed(0)}K
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggle(process.id)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 rounded-lg border-2 transition-all duration-200',
                          isSelected
                            ? `${colors.bg} ${colors.border} ${colors.text} font-medium`
                            : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        )}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                        <span className="text-sm">
                          {isSelected ? 'Ya, diperlukan' : 'Tidak diperlukan'}
                        </span>
                        {process.investment && (
                          <span className="text-xs opacity-70 ml-auto">
                            ${((process.investment || 0) / 1000).toFixed(0)}K • {process.manpower} MP
                          </span>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className={cn(
                        'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center',
                        colors.text,
                        colors.bg,
                        'border-2 border-white dark:border-slate-800 shadow-lg'
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Card */}
      <AnimatePresence>
        {hasSelections && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="mb-6"
          >
            <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Estimasi Biaya Tambahan
                </h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  key={`mp-${totalManpower}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Manpower</span>
                  </div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {totalManpower.toFixed(1)} MP
                  </div>
                </motion.div>

                <motion.div
                  key={`inv-${totalInvestment}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Investment</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ${(totalInvestment / 1000).toFixed(0)}K
                  </div>
                </motion.div>

                <motion.div
                  key={`labor-${monthlyLaborCost}`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Labor/bulan</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    Rp {(monthlyLaborCost / 1000000).toFixed(1)}jt
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-3"
      >
        {onSkip && (
          <Button
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Skip
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isCalculating}
          className={cn(
            'flex-1 gap-2 transition-all duration-300',
            hasSelections
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
              : ''
          )}
        >
          {isCalculating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Calculator className="w-4 h-4" />
              </motion.div>
              Menghitung...
            </>
          ) : (
            <>
              {hasSelections ? 'Hitung Investasi' : 'Tidak Ada Tambahan'}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
