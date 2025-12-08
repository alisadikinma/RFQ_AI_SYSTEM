'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { ModelCard } from '@/components/models/ModelCard';
import { ModelWithDetails, getModels } from '@/lib/api/models';
import { containerVariants, itemVariants } from '@/lib/animations';

export default function ModelsPage() {
  const [models, setModels] = useState<ModelWithDetails[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadModels = async () => {
    try {
      const data = await getModels();
      setModels(data);
      setFilteredModels(data);
    } catch (error: any) {
      toast.error('Failed to load models', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    let filtered = models;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (customerFilter !== 'All') {
      filtered = filtered.filter((m) => m.customer.code === customerFilter);
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    setFilteredModels(filtered);
  }, [searchQuery, customerFilter, statusFilter, models]);

  const customers = ['All', ...Array.from(new Set(models.map((m) => m.customer.code)))];
  const statuses = ['All', 'active', 'inactive'];

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Customer" />
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'All' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-slate-500 flex items-center">
              Showing {filteredModels.length}
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredModels.length === 0 ? (
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
              {searchQuery || customerFilter !== 'All' || statusFilter !== 'All'
                ? 'Try adjusting your filters'
                : 'Add your first model to get started'}
            </p>
            {!searchQuery && customerFilter === 'All' && statusFilter === 'All' && (
              <Link href="/models/new">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredModels.map((model) => (
              <motion.div key={model.id} variants={itemVariants}>
                <ModelCard model={model} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
