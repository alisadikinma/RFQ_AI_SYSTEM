'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RFQItem {
  id: string;
  customer: string;
  model: string;
  status: 'completed' | 'processing' | 'draft' | 'failed';
  match: number | null;
}

interface RecentRFQTableProps {
  rfqs: RFQItem[];
}

export function RecentRFQTable({ rfqs }: RecentRFQTableProps) {
  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          📝 Recent RFQ Requests
        </h3>
        <Link href="/rfq">
          <Button variant="ghost" className="gap-2 text-primary-600 hover:text-primary-700">
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Match</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfqs.map((rfq, index) => (
              <motion.tr
                key={rfq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="border-b border-slate-100 dark:border-slate-700/50"
              >
                <TableCell className="font-medium">{rfq.id}</TableCell>
                <TableCell>{rfq.customer}</TableCell>
                <TableCell>{rfq.model}</TableCell>
                <TableCell>
                  <StatusBadge status={rfq.status} />
                </TableCell>
                <TableCell className="text-right">
                  {rfq.match ? (
                    <span className={`font-semibold ${getMatchColor(rfq.match)}`}>
                      {rfq.match}%
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {rfq.status === 'completed' && (
                    <Link href={`/rfq/${rfq.id.toLowerCase()}/results`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
