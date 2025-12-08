'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, Eye, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableRowSkeleton } from '@/components/shared/LoadingSkeleton';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { containerVariants } from '@/lib/animations';
import { getRFQs, deleteRFQ, getTopMatchForRFQ, type RFQRequest } from '@/lib/api/rfq';
import { getCustomers, type Customer } from '@/lib/api/customers';

interface RFQWithCustomer extends RFQRequest {
  customer: { id: string; code: string; name: string } | null;
  topMatch?: number | null;
}

export default function RFQHistoryPage() {
  const [rfqs, setRfqs] = useState<RFQWithCustomer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRFQ, setDeletingRFQ] = useState<RFQWithCustomer | null>(null);
  const itemsPerPage = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      const [rfqData, customerData] = await Promise.all([
        getRFQs(),
        getCustomers(),
      ]);

      // Fetch top match scores for completed RFQs
      const rfqsWithMatches = await Promise.all(
        rfqData.map(async (rfq) => {
          let topMatch = null;
          if (rfq.status === 'completed') {
            topMatch = await getTopMatchForRFQ(rfq.id);
          }
          return { ...rfq, topMatch };
        })
      );

      setRfqs(rfqsWithMatches);
      setCustomers(customerData);
    } catch (error) {
      console.error('Failed to load RFQs:', error);
      toast.error('Failed to load RFQ requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deletingRFQ) return;

    try {
      await deleteRFQ(deletingRFQ.id);
      setRfqs(rfqs.filter(r => r.id !== deletingRFQ.id));
      toast.success('RFQ deleted successfully');
    } catch (error) {
      console.error('Failed to delete RFQ:', error);
      toast.error('Failed to delete RFQ');
      throw error; // Re-throw so DeleteDialog can handle it
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    const rfqCode = `RFQ-${rfq.id.slice(0, 6).toUpperCase()}`;
    const matchesSearch =
      rfqCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfq.customer?.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.model_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer = customerFilter === 'All' || rfq.customer?.code === customerFilter;
    const matchesStatus = statusFilter === 'All' || rfq.status === statusFilter;

    return matchesSearch && matchesCustomer && matchesStatus;
  });

  const paginatedRFQs = filteredRFQs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRFQs.length / itemsPerPage);

  const customerOptions = ['All', ...Array.from(new Set(customers.map(c => c.code)))];
  const statuses = ['All', 'completed', 'processing', 'draft', 'failed'];

  const getMatchColor = (score: number | null | undefined) => {
    if (!score) return 'text-slate-400';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const generateRFQCode = (id: string) => {
    return `RFQ-${id.slice(0, 6).toUpperCase()}`;
  };

  if (loading) {
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
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
              <Select value={customerFilter} onValueChange={(value) => {
                setCustomerFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((customer) => (
                    <SelectItem key={customer} value={customer}>
                      {customer === 'All' ? 'All Customers' : customer}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
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
                Showing {filteredRFQs.length} of {rfqs.length}
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
                  {paginatedRFQs.map((rfq, index) => (
                    <motion.tr
                      key={rfq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="font-mono font-medium">
                        {generateRFQCode(rfq.id)}
                      </TableCell>
                      <TableCell>{rfq.customer?.code || '-'}</TableCell>
                      <TableCell>{rfq.model_name}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {formatDate(rfq.created_at)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={rfq.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-semibold tabular-nums ${getMatchColor(rfq.topMatch)}`}>
                          {rfq.topMatch ? `${Math.round(rfq.topMatch)}%` : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setDeletingRFQ(rfq);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
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
                  Showing <span className="font-medium">{paginatedRFQs.length}</span> of{' '}
                  <span className="font-medium">{filteredRFQs.length}</span> results
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant="outline"
                        size="sm"
                        className={page === currentPage ? 'bg-primary-50 dark:bg-primary-900/30' : ''}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
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

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingRFQ(null);
        }}
        onConfirm={handleDelete}
        title="Delete RFQ"
        description={
          deletingRFQ
            ? `Are you sure you want to delete RFQ "${generateRFQCode(deletingRFQ.id)}" for model "${deletingRFQ.model_name}"?`
            : ''
        }
      />
    </PageTransition>
  );
}
