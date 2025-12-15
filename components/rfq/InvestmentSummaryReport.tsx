'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  DollarSign,
  Factory,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// UMK Batam 2025
const UMK_BATAM = 4989600;
const USD_TO_IDR = 15800;

interface ProcessSelection {
  id: string;
  name: string;
  nameId: string;
  selected: boolean | string;
  manpower: number;
  investment: number;
  cycleTime?: number;
}

interface ReferenceModel {
  code: string;
  customer: string;
  similarity: number;
  totalStations: number;
  totalManpower: number;
}

interface InvestmentSummaryProps {
  selections: Record<string, boolean | string>;
  totalManpower: number;
  totalInvestment: number;
  monthlyLaborCost: number;
  referenceModel?: ReferenceModel;
  targetUPH?: number;
  onExportPDF?: () => void;
}

// Process definitions for display
const PROCESS_DETAILS: Record<string, { name: string; nameId: string; icon: React.ElementType }> = {
  printing_isn: { name: 'Printing ISN', nameId: 'Cetak ISN', icon: Zap },
  router: { name: 'Router Machine', nameId: 'Mesin Router', icon: Factory },
  underfill: { name: 'Underfill Process', nameId: 'Proses Underfill', icon: Factory },
  thermal_glue: { name: 'Thermal & Glue', nameId: 'Thermal & Lem', icon: Factory },
  visual: { name: 'Visual Inspection', nameId: 'Inspeksi Visual', icon: Users },
  shipment: { name: 'Shipment', nameId: 'Pengiriman', icon: Building2 },
};

export function InvestmentSummaryReport({
  selections,
  totalManpower,
  totalInvestment,
  monthlyLaborCost,
  referenceModel,
  targetUPH = 100,
  onExportPDF,
}: InvestmentSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Calculate derived values
  const annualLaborCost = monthlyLaborCost * 12;
  const totalFirstYearCost = totalInvestment * USD_TO_IDR + annualLaborCost;
  const costPerUnit = targetUPH > 0 ? (monthlyLaborCost / (targetUPH * 8 * 22)) : 0; // per unit labor cost
  const paybackMonths = totalInvestment > 0 ? Math.ceil((totalInvestment * USD_TO_IDR) / monthlyLaborCost) : 0;

  // Get active processes
  const activeProcesses = Object.entries(selections)
    .filter(([_, value]) => value)
    .map(([key, value]) => ({
      key,
      value,
      ...PROCESS_DETAILS[key],
    }));

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // Dynamic import for PDF generation
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      if (reportRef.current) {
        // Temporarily show details for PDF
        setShowDetails(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`Investment_Report_${referenceModel?.code || 'RFQ'}_${new Date().toISOString().split('T')[0]}.pdf`);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      // Fallback: print
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Main Report Container */}
      <div 
        ref={reportRef}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl print:shadow-none"
      >
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium text-blue-100">Investment Analysis Report</span>
              </div>
              <h2 className="text-2xl font-bold">
                Additional Process Investment
              </h2>
              {referenceModel && (
                <p className="text-blue-100 mt-1">
                  Reference: {referenceModel.customer} - {referenceModel.code} ({referenceModel.similarity}% match)
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200">Generated</p>
              <p className="text-sm font-medium">
                {new Date().toLocaleDateString('id-ID', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary - KPI Cards */}
        <div className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Investment */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800"
            >
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                <DollarSign className="w-5 h-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Total Investment</span>
              </div>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                ${(totalInvestment / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                ≈ Rp {(totalInvestment * USD_TO_IDR / 1000000000).toFixed(2)} M
              </p>
            </motion.div>

            {/* Total Manpower */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Manpower</span>
              </div>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {totalManpower.toFixed(1)} <span className="text-base font-normal">MP</span>
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                Additional operators
              </p>
            </motion.div>

            {/* Monthly Labor Cost */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800"
            >
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Monthly Labor</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {(monthlyLaborCost / 1000000).toFixed(1)} <span className="text-base font-normal">Jt</span>
              </p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                Rp/bulan
              </p>
            </motion.div>

            {/* Payback Period */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-xs font-medium uppercase tracking-wide">Est. Payback</span>
              </div>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {paybackMonths} <span className="text-base font-normal">bulan</span>
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
                Break-even period
              </p>
            </motion.div>
          </div>

          {/* Process Breakdown - Visual */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Selected Additional Processes ({activeProcesses.length})
            </h3>
            
            {activeProcesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeProcesses.map((process, index) => (
                  <motion.div
                    key={process.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {process.name}
                    </span>
                    {typeof process.value === 'string' && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        ({process.value})
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tidak ada proses tambahan yang dipilih
              </p>
            )}
          </div>

          {/* Detailed Breakdown Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Sembunyikan Detail
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Tampilkan Detail Lengkap
              </>
            )}
          </button>

          {/* Detailed Tables */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pt-4"
              >
                {/* Investment Breakdown Table */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Investment Breakdown
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Process</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Equipment (USD)</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Manpower</th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Labor/Month (IDR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {activeProcesses.length > 0 ? (
                          activeProcesses.map((process) => {
                            // Get values based on selection
                            const investmentMap: Record<string, number> = {
                              'printing_isn': process.value === 'laser' ? 13500 : 3000,
                              'router': 50000,
                              'underfill': 27000,
                              'thermal_glue': 9000,
                              'visual': 2500,
                              'shipment': 0,
                            };
                            const mpMap: Record<string, number> = {
                              'printing_isn': process.value === 'laser' ? 0.3 : 0.2,
                              'router': 1.0,
                              'underfill': 1.5,
                              'thermal_glue': 0.5,
                              'visual': 1.5,
                              'shipment': process.value === 'external' ? 0.3 : 0.2,
                            };
                            const inv = investmentMap[process.key] || 0;
                            const mp = mpMap[process.key] || 0;
                            const labor = mp * UMK_BATAM;

                            return (
                              <tr key={process.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                  {process.name}
                                  {typeof process.value === 'string' && (
                                    <span className="text-slate-500 ml-1">({process.value})</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                  ${inv.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {mp.toFixed(1)} MP
                                </td>
                                <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                  Rp {labor.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-4 px-4 text-center text-slate-500">
                              Tidak ada proses tambahan
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-100 dark:bg-slate-800 font-semibold">
                          <td className="py-3 px-4 text-slate-800 dark:text-slate-200">TOTAL</td>
                          <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                            ${totalInvestment.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                            {totalManpower.toFixed(1)} MP
                          </td>
                          <td className="py-3 px-4 text-right text-purple-600 dark:text-purple-400">
                            Rp {monthlyLaborCost.toLocaleString('id-ID')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Annual Projection */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Annual Cost Projection
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Year 1 Total Cost</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Rp {(totalFirstYearCost / 1000000000).toFixed(2)} M
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Investment + Labor</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Year 2+ Annual Cost</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Rp {(annualLaborCost / 1000000000).toFixed(2)} M
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Labor only</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cost per Unit</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        Rp {Math.round(costPerUnit).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Labor cost @{targetUPH} UPH</p>
                    </div>
                  </div>
                </div>

                {/* Assumptions */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                    Assumptions & Notes
                  </h4>
                  <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                    <li>• UMK Batam 2025: Rp {UMK_BATAM.toLocaleString('id-ID')}/bulan</li>
                    <li>• Exchange Rate: 1 USD = Rp {USD_TO_IDR.toLocaleString('id-ID')}</li>
                    <li>• Working hours: 8 jam/hari, 22 hari/bulan</li>
                    <li>• Efficiency factor: 85%</li>
                    <li>• Equipment depreciation: 5 tahun (tidak termasuk dalam kalkulasi)</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generated by RFQ AI System • PT Satnusa Persada
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isExporting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Download className="w-4 h-4" />
                    </motion.div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #investment-report, #investment-report * {
            visibility: visible;
          }
          #investment-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </motion.div>
  );
}
