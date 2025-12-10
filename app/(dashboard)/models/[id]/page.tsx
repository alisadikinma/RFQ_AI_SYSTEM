'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Factory, Users, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { DeleteDialog } from '@/components/shared/DeleteDialog';
import { StatsCard } from '@/components/shared/StatsCard';
import { ModelWithDetails, getModelById, deleteModel } from '@/lib/api/models';
import { containerVariants, itemVariants } from '@/lib/animations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ✅ Constants for investment calculation
const MONTHLY_WAGE_IDR = 4_500_000; // Batam UMK 2025 ~4.5jt
const INVESTMENT_FACTOR = 3; // Equipment + Space + Utilities multiplier

// ✅ Format currency for Indonesian Rupiah
function formatCurrency(value: number, short: boolean = true): string {
  if (short) {
    if (value >= 1_000_000_000) {
      return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `Rp ${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `Rp ${(value / 1_000).toFixed(0)}K`;
    }
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// ✅ Calculate investment per manpower
function calcInvestment(mp: number): number {
  return mp * MONTHLY_WAGE_IDR * INVESTMENT_FACTOR;
}

export default function ModelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [model, setModel] = useState<ModelWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const modelId = params.id as string;

  const loadModel = async () => {
    if (!modelId) return;
    try {
      const data = await getModelById(modelId);
      if (!data) {
        toast.error('Model not found');
        router.push('/models');
        return;
      }
      setModel(data);
      if (data.board_types.length > 0) {
        setActiveTab(data.board_types[0]);
      }
    } catch (error: any) {
      toast.error('Failed to load model', {
        description: error.message,
      });
      router.push('/models');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModel();
  }, [modelId]);

  const handleDelete = async () => {
    if (!model) return;

    try {
      await deleteModel(model.id);
      toast.success('Model deleted successfully', {
        description: `${model.code} - ${model.name}`,
      });
      router.push('/models');
    } catch (error: any) {
      toast.error('Failed to delete model', {
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <LoadingSkeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-28" />
            ))}
          </div>
          <LoadingSkeleton className="h-96" />
        </div>
      </PageTransition>
    );
  }

  if (!model) {
    return null;
  }

  const totalMP = model.stations.reduce((sum, station) => sum + station.manpower, 0);
  const stationCount = model.stations.length;

  const bottleneck = model.stations.length > 0 
    ? model.stations.reduce((min, station) => {
        return station.machine.typical_uph < min.machine.typical_uph ? station : min;
      }, model.stations[0])
    : null;

  const uph = bottleneck?.machine.typical_uph || 0;
  const totalInvestment = calcInvestment(totalMP);

  // Group stations by board type
  const stationsByBoardType = model.board_types.reduce((acc, boardType) => {
    acc[boardType] = model.stations
      .filter(s => s.board_type === boardType)
      .sort((a, b) => a.sequence - b.sequence);
    return acc;
  }, {} as Record<string, typeof model.stations>);

  // Get active tab stations
  const activeStations = activeTab ? stationsByBoardType[activeTab] || [] : [];
  
  // ✅ Calculate totals for active tab
  const activeTabTotalMP = activeStations.reduce((sum, s) => sum + s.manpower, 0);
  const activeTabTotalInvestment = calcInvestment(activeTabTotalMP);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/models">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {model.code}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {model.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Customer & Status Info */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Customer:</span>
                <span className="font-medium">{model.customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
                <Badge
                  variant={model.status === 'active' ? 'default' : 'secondary'}
                  className={model.status === 'active' ? 'bg-success' : ''}
                >
                  {model.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            {model.board_types.length > 0 && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Board Types:</p>
                <div className="flex flex-wrap gap-2">
                  {model.board_types.map((type, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 rounded-full text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards - 5 columns with Investment */}
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <StatsCard
            title="Total Stations"
            value={stationCount}
            icon={Factory}
          />
          <StatsCard
            title="Total Manpower"
            value={totalMP}
            icon={Users}
          />
          {/* Total Investment Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Total Investment
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {formatCurrency(totalInvestment)}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  /month
                </p>
              </div>
            </div>
          </div>
          <StatsCard
            title="Target UPH"
            value={uph}
            icon={TrendingUp}
          />
          {/* Bottleneck Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Bottleneck
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {bottleneck?.machine.code || 'N/A'}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {bottleneck?.machine.name || '-'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Board Type Tabs + Station Table */}
        {model.board_types.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Horizontal Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
              <div className="flex overflow-x-auto">
                {model.board_types.map((boardType) => {
                  const stations = stationsByBoardType[boardType] || [];
                  const isActive = activeTab === boardType;
                  
                  return (
                    <button
                      key={boardType}
                      onClick={() => setActiveTab(boardType)}
                      className={cn(
                        "relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors",
                        "hover:bg-slate-50 dark:hover:bg-slate-700/50",
                        isActive 
                          ? "text-primary-600 dark:text-primary-400" 
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {boardType}
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs px-1.5 py-0.5",
                            isActive && "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                          )}
                        >
                          {stations.length}
                        </Badge>
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Flow Info */}
                {activeStations.length > 0 && (
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Flow:</span>{' '}
                      {activeStations.map(s => s.machine.code).join(' → ')}
                    </p>
                  </div>
                )}

                {/* ✅ Station Table with Investment Column */}
                {activeStations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Station</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-center">MP</TableHead>
                          <TableHead className="text-right">Investment</TableHead>
                          <TableHead className="text-center">UPH</TableHead>
                          <TableHead className="text-right">Cycle (s)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeStations.map((station, index) => {
                          const isBottleneck = station.machine.id === bottleneck?.machine.id;
                          const stationInvestment = calcInvestment(station.manpower);
                          
                          return (
                            <TableRow key={station.id}>
                              <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                              <TableCell className="font-mono font-medium">
                                <span className="flex items-center gap-2">
                                  {station.machine.code}
                                  {isBottleneck && (
                                    <span className="text-warning" title="Bottleneck station">🔴</span>
                                  )}
                                </span>
                              </TableCell>
                              <TableCell className="text-slate-600 dark:text-slate-400">
                                {station.machine.name}
                              </TableCell>
                              <TableCell className="text-center tabular-nums font-medium">
                                {station.manpower}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400 font-medium">
                                {formatCurrency(stationInvestment)}
                              </TableCell>
                              <TableCell className="text-center tabular-nums">
                                {station.machine.typical_uph}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {station.machine.typical_cycle_time_sec}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      {/* ✅ Table Footer with Totals */}
                      <TableFooter>
                        <TableRow className="bg-slate-100 dark:bg-slate-700/50 font-semibold">
                          <TableCell colSpan={3} className="text-right">
                            Total
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {activeTabTotalMP}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-green-600 dark:text-green-400">
                            {formatCurrency(activeTabTotalInvestment)}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    No stations configured for this board type
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State if no board types */}
        {model.board_types.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center"
          >
            <Factory className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No Stations Configured
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              This model doesn&apos;t have any board types or stations configured yet.
            </p>
          </motion.div>
        )}
      </div>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${model.name}"?`}
        description="Are you sure you want to delete this model? All associated station assignments will be removed."
        warningMessage=""
      />
    </PageTransition>
  );
}
