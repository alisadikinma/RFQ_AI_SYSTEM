'use client';

import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InvestmentBreakdownProps {
  breakdown: any[];
}

export function InvestmentBreakdown({ breakdown }: InvestmentBreakdownProps) {
  const subtotal = breakdown.reduce((sum, item) => sum + item.subtotal, 0);
  const fixtures = 8000;
  const installation = 5000;
  const training = 2000;
  const grandTotal = subtotal + fixtures + installation + training;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Investment Estimation
        </h3>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
            Machine Investment
          </h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead>Vendor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {breakdown.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.station}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right">
                    ${item.unit_price.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.subtotal.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {item.vendor}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                <TableCell>Subtotal</TableCell>
                <TableCell className="text-right">
                  {breakdown.reduce((sum, item) => sum + item.qty, 0)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  ${subtotal.toLocaleString()}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white mb-3">
            Additional Costs
          </h4>
          <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Fixtures & Jigs
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                ${fixtures.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Installation
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                ${installation.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Training
              </span>
              <span className="font-medium text-slate-900 dark:text-white">
                ${training.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-slate-900 dark:border-white pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              GRAND TOTAL
            </span>
            <span className="text-2xl font-bold text-primary-600">
              ${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
