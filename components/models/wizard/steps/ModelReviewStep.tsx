'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Building2, Tag, Package, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCustomers, type Customer } from '@/lib/api/customers';
import { getMachines, type Machine } from '@/lib/api/stations';

interface Station {
  id: string;
  machineId: string;
  manpower: number;
}

interface ModelReviewStepProps {
  data: {
    code?: string;
    name?: string;
    customerId?: string;
    status?: 'active' | 'inactive';
    boardTypes?: string[];
    stations?: Record<string, Station[]>;
  };
  onEdit: (stepIndex: number) => void;
}

export function ModelReviewStep({ data, onEdit }: ModelReviewStepProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerData, machineData] = await Promise.all([
          getCustomers(),
          getMachines(),
        ]);
        setCustomers(customerData);
        setMachines(machineData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const customer = customers.find(c => c.id === data.customerId);
  const getMachineById = (id: string) => machines.find(m => m.id === id);

  const boardTypes = data.boardTypes || [];
  const stations = data.stations || {};

  const totalStations = boardTypes.reduce(
    (sum, type) => sum + (stations[type]?.length || 0),
    0
  );
  const totalManpower = boardTypes.reduce(
    (sum, type) => sum + (stations[type]?.reduce((s, st) => s + st.manpower, 0) || 0),
    0
  );

  const getBottleneckUPH = () => {
    let minUPH = Infinity;
    boardTypes.forEach(type => {
      (stations[type] || []).forEach(station => {
        const machine = getMachineById(station.machineId);
        if (machine && machine.typical_uph < minUPH) {
          minUPH = machine.typical_uph;
        }
      });
    });
    return minUPH === Infinity ? 0 : minUPH;
  };

  const hasValidationErrors = () => {
    if (!data.code || !data.name || !data.customerId) return true;
    if (boardTypes.length === 0) return true;
    for (const type of boardTypes) {
      if (!stations[type] || stations[type].length === 0) return true;
      for (const station of stations[type]) {
        if (!station.machineId) return true;
      }
    }
    return false;
  };

  const getValidationWarnings = () => {
    const warnings: string[] = [];
    if (!data.code) warnings.push('Model code is required');
    if (!data.name) warnings.push('Model name is required');
    if (!data.customerId) warnings.push('Customer is required');
    if (boardTypes.length === 0) warnings.push('At least one board type is required');

    boardTypes.forEach(type => {
      if (!stations[type] || stations[type].length === 0) {
        warnings.push(`No stations configured for board type ${type}`);
      } else {
        stations[type].forEach((station, index) => {
          if (!station.machineId) {
            warnings.push(`Station ${index + 1} in board type ${type} has no machine selected`);
          }
        });
      }
    });

    return warnings;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const validationWarnings = getValidationWarnings();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Review & Confirm
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Please review the model configuration before saving
        </p>
      </div>

      {validationWarnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-200">
                Please fix the following issues:
              </h4>
              <ul className="mt-2 space-y-1">
                {validationWarnings.map((warning, index) => (
                  <li key={index} className="text-sm text-amber-700 dark:text-amber-300">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Model Info Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Model Information
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onEdit(0)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Customer</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {customer ? `${customer.code} - ${customer.name}` : '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Model Code</p>
              <p className="font-mono font-medium text-slate-900 dark:text-white">
                {data.code || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Model Name</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {data.name || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
              <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
                {data.status || 'active'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Board Types</p>
          <div className="flex flex-wrap gap-2">
            {boardTypes.length > 0 ? (
              boardTypes.map(type => (
                <Badge key={type} variant="outline">{type}</Badge>
              ))
            ) : (
              <span className="text-slate-400">No board types selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Stations Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Station Configuration
          </h3>
          <Button variant="ghost" size="sm" onClick={() => onEdit(1)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        </div>

        {boardTypes.length > 0 ? (
          <div className="space-y-6">
            {boardTypes.map(boardType => (
              <div key={boardType}>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Board Type: {boardType}
                </h4>
                {stations[boardType] && stations[boardType].length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Machine</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">UPH</TableHead>
                        <TableHead className="text-right">MP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stations[boardType].map((station, index) => {
                        const machine = getMachineById(station.machineId);
                        return (
                          <TableRow key={station.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>
                              {machine ? (
                                <span className="font-mono">{machine.code}</span>
                              ) : (
                                <span className="text-red-500">Not selected</span>
                              )}
                            </TableCell>
                            <TableCell>{machine?.category || '-'}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {machine?.typical_uph || '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {station.manpower}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    No stations configured for this board type
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400">
            No board types configured
          </p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
            {totalStations}
          </p>
          <p className="text-sm text-primary-600 dark:text-primary-400">Total Stations</p>
        </div>
        <div className="bg-success/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-success">
            {totalManpower}
          </p>
          <p className="text-sm text-success/80">Total Manpower</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {getBottleneckUPH()}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">Bottleneck UPH</p>
        </div>
      </div>
    </div>
  );
}
