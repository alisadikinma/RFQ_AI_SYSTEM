'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Eye, Plus, Search } from 'lucide-react';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { containerVariants } from '@/lib/animations';

const mockRFQs = [
  {
    id: 'rfq-001234',
    code: 'RFQ-001234',
    customer: 'XIAOMI',
    model: 'POCO-X7',
    status: 'completed' as const,
    submittedAt: 'Dec 8, 2024',
    topMatch: 92
  },
  {
    id: 'rfq-001233',
    code: 'RFQ-001233',
    customer: 'TCL',
    model: 'TCL-50XE',
    status: 'processing' as const,
    submittedAt: 'Dec 7, 2024',
    topMatch: null
  },
  {
    id: 'rfq-001232',
    code: 'RFQ-001232',
    customer: 'REALME',
    model: 'REALME-C55',
    status: 'completed' as const,
    submittedAt: 'Dec 6, 2024',
    topMatch: 87
  },
  {
    id: 'rfq-001231',
    code: 'RFQ-001231',
    customer: 'XIAOMI',
    model: 'REDMI-13',
    status: 'completed' as const,
    submittedAt: 'Dec 5, 2024',
    topMatch: 78
  },
  {
    id: 'rfq-001230',
    code: 'RFQ-001230',
    customer: 'OPPO',
    model: 'OPPO-A79',
    status: 'draft' as const,
    submittedAt: 'Dec 4, 2024',
    topMatch: null
  },
  {
    id: 'rfq-001229',
    code: 'RFQ-001229',
    customer: 'VIVO',
    model: 'VIVO-Y36',
    status: 'failed' as const,
    submittedAt: 'Dec 3, 2024',
    topMatch: null
  }
];

export default function RFQHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredRFQs = mockRFQs.filter(rfq => {
    const matchesSearch =
      rfq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.model.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer = customerFilter === 'All' || rfq.customer === customerFilter;
    const matchesStatus = statusFilter === 'All' || rfq.status === statusFilter;

    return matchesSearch && matchesCustomer && matchesStatus;
  });

  const customers = ['All', ...Array.from(new Set(mockRFQs.map(rfq => rfq.customer)))];
  const statuses = ['All', 'completed', 'processing', 'draft', 'failed'];

  const getMatchColor = (score: number | null) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              RFQ History
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              View and manage all RFQ requests
            </p>
          </div>
          <Link href="/rfq/new">
            <Button className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700">
              <Plus className="w-4 h-4" />
              New RFQ
            </Button>
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by RFQ ID, model, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer === 'All' ? 'All Customers' : customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-500 flex items-center whitespace-nowrap">
                Showing {filteredRFQs.length} of {mockRFQs.length}
              </div>
            </div>
          </div>

          {filteredRFQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                No RFQ requests found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {searchQuery || customerFilter !== 'All' || statusFilter !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Create your first RFQ request to get started'}
              </p>
              {!searchQuery && customerFilter === 'All' && statusFilter === 'All' && (
                <Link href="/rfq/new">
                  <Button className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    New RFQ
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>RFQ ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Match %</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRFQs.map((rfq, index) => (
                    <motion.tr
                      key={rfq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="font-mono font-medium">{rfq.code}</TableCell>
                      <TableCell>{rfq.customer}</TableCell>
                      <TableCell>{rfq.model}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {rfq.submittedAt}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={rfq.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold tabular-nums ${getMatchColor(rfq.topMatch)}`}>
                          {rfq.topMatch ? `${rfq.topMatch}%` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {rfq.status === 'completed' && (
                          <Link href={`/rfq/${rfq.id}/results`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </Button>
                          </Link>
                        )}
                        {rfq.status === 'processing' && (
                          <Link href={`/rfq/${rfq.id}/processing`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              Status
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredRFQs.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Showing <span className="font-medium">{filteredRFQs.length}</span> of{' '}
                  <span className="font-medium">{mockRFQs.length}</span> results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="bg-primary-50 dark:bg-primary-900/30">
                      1
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= Math.ceil(filteredRFQs.length / itemsPerPage)}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
