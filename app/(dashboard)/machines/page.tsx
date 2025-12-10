'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Factory, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableRowSkeleton } from '@/components/shared/LoadingSkeleton';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { MachineDialog } from '@/components/machines/MachineDialog';
import { Machine, deleteMachine, getMachineUsageCount } from '@/lib/api/stations';
import { useStationsPaginated, useStationCategories } from '@/lib/hooks/use-queries';
import { containerVariants } from '@/lib/animations';

const PAGE_SIZE = 15;

const rowVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

export default function MachinesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [deleteWarning, setDeleteWarning] = useState('');

  // Get params from URL
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';

  // ✅ React Query hooks - dengan caching otomatis!
  const { data: result, isLoading, isFetching } = useStationsPaginated({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    category: category !== 'All' ? category : undefined,
  });
  
  const { data: categories = [] } = useStationCategories();

  // Sync search input with URL param on mount
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Invalidate cache and refetch
  const refreshMachines = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['stations'] });
  }, [queryClient]);

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
    router.push(`/machines?${params.toString()}`);
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

  const handleCategoryChange = (value: string) => {
    updateParams({ category: value });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleAddMachine = () => {
    setSelectedMachine(null);
    setIsDialogOpen(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (machine: Machine) => {
    const usageCount = await getMachineUsageCount(machine.id);
    setMachineToDelete(machine);
    setDeleteWarning(
      usageCount > 0
        ? `This machine is used in ${usageCount} model${usageCount > 1 ? 's' : ''}. Deleting it will remove all associated station assignments.`
        : ''
    );
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!machineToDelete) return;

    try {
      await deleteMachine(machineToDelete.id);
      toast.success('Machine deleted successfully', {
        description: `${machineToDelete.code} - ${machineToDelete.name}`,
      });
      refreshMachines();
    } catch (error: any) {
      toast.error('Failed to delete machine', {
        description: error.message,
      });
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Machines
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage testing stations and equipment
            </p>
          </div>
          <Button
            onClick={handleAddMachine}
            className="bg-gradient-to-r from-primary-600 to-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Machine
          </Button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search machines..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-500 flex items-center whitespace-nowrap gap-2">
                {result ? `${result.total} total` : '...'}
                {isFetching && !isLoading && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4">
              {[...Array(8)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : !result || result.data.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Factory className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                No machines found
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {search || category !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Add your first machine to get started'}
              </p>
              {!search && category === 'All' && (
                <Button onClick={handleAddMachine} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Machine
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">UPH</TableHead>
                      <TableHead className="text-right">Cycle Time (s)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.map((machine, index) => (
                      <motion.tr
                        key={machine.id}
                        variants={rowVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        custom={index}
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-mono font-medium">{machine.code}</TableCell>
                        <TableCell>{machine.name}</TableCell>
                        <TableCell>
                          <span className="inline-flex px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700">
                            {machine.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{machine.typical_uph}</TableCell>
                        <TableCell className="text-right tabular-nums">{machine.typical_cycle_time_sec}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMachine(machine)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(machine)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {result.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
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
        </motion.div>
      </div>

      <MachineDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        machine={selectedMachine}
        onSuccess={refreshMachines}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete "${machineToDelete?.name}"?`}
        description="Are you sure you want to delete this machine?"
        warningMessage={deleteWarning}
      />
    </PageTransition>
  );
}
