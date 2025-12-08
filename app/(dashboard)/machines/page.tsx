'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingSkeleton, TableRowSkeleton } from '@/components/shared/LoadingSkeleton';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { MachineDialog } from '@/components/machines/MachineDialog';
import { Machine, getMachines, deleteMachine, getMachineUsageCount } from '@/lib/api/stations';
import { containerVariants, itemVariants } from '@/lib/animations';

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
  const [machines, setMachines] = useState<Machine[]>([]);
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [deleteWarning, setDeleteWarning] = useState('');

  const loadMachines = async () => {
    try {
      const data = await getMachines();
      setMachines(data);
      setFilteredMachines(data);
    } catch (error: any) {
      toast.error('Failed to load machines', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, []);

  useEffect(() => {
    let filtered = machines;

    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'All') {
      filtered = filtered.filter((m) => m.category === categoryFilter);
    }

    setFilteredMachines(filtered);
  }, [searchQuery, categoryFilter, machines]);

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
      loadMachines();
    } catch (error: any) {
      toast.error('Failed to delete machine', {
        description: error.message,
      });
    }
  };

  const categories = ['All', ...Array.from(new Set(machines.map((m) => m.category)))];

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-500 flex items-center">
                Showing {filteredMachines.length}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : filteredMachines.length === 0 ? (
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
                {searchQuery || categoryFilter !== 'All'
                  ? 'Try adjusting your filters'
                  : 'Add your first machine to get started'}
              </p>
              {!searchQuery && categoryFilter === 'All' && (
                <Button onClick={handleAddMachine} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Machine
                </Button>
              )}
            </motion.div>
          ) : (
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
                  {filteredMachines.map((machine, index) => (
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
          )}
        </motion.div>
      </div>

      <MachineDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        machine={selectedMachine}
        onSuccess={loadMachines}
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
