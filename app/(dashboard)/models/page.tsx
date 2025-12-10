'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ModelCard } from '@/components/models/ModelCard';
import { useModelsList, useCustomerOptions, usePrefetchModel } from '@/lib/hooks/use-queries';
import { containerVariants, itemVariants } from '@/lib/animations';

const PAGE_SIZE = 18;

export default function ModelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const [searchInput, setSearchInput] = useState('');
  
  // Get params from URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const customer = searchParams.get('customer') || 'All';
  const status = searchParams.get('status') || 'All';

  // ✅ React Query hooks - dengan caching otomatis!
  const { data: result, isLoading, isFetching } = useModelsList({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    customer: customer !== 'All' ? customer : undefined,
    status: status !== 'All' ? status : undefined,
  });
  
  const { data: customers = [] } = useCustomerOptions();
  
  // Prefetch untuk hover
  const prefetchModel = usePrefetchModel();

  // Sync search input with URL param on mount
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Update URL params
  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'All' && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (!('page' in updates)) {
      params.delete('page');
    }
    router.push(`/models?${params.toString()}`);
  }, [router, searchParams]);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value });
    }, 300);
  };

  const handleCustomerChange = (value: string) => {
    updateParams({ customer: value });
  };

  const handleStatusChange = (value: string) => {
    updateParams({ status: value });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Models
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Historical production models and configurations
            </p>
          </div>
          <Link href="/models/new">
            <Button className="bg-gradient-to-r from-primary-600 to-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Model
            </Button>
          </Link>
        </div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search models..."
                value={searchInput}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Select value={customer} onValueChange={handleCustomerChange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Customers</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-slate-500 flex items-center whitespace-nowrap gap-2">
              {result ? `${result.total} total` : '...'}
              {/* Show subtle loading indicator for background refetch */}
              {isFetching && !isLoading && (
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : !result || result.data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-16 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
              No models found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {search || customer !== 'All' || status !== 'All'
                ? 'Try adjusting your filters'
                : 'Add your first model to get started'}
            </p>
            {!search && customer === 'All' && status === 'All' && (
              <Link href="/models/new">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {result.data.map((model) => (
                <motion.div 
                  key={model.id} 
                  variants={itemVariants}
                  // ✅ Prefetch data saat hover - navigasi jadi instant!
                  onMouseEnter={() => prefetchModel(model.id)}
                >
                  <ModelCard model={model as any} />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, result.total)} of {result.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, result.totalPages))].map((_, i) => {
                      let pageNum: number;
                      if (result.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= result.totalPages - 2) {
                        pageNum = result.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= result.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
