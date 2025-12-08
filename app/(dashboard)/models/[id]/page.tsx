'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Factory, Users, TrendingUp, AlertTriangle } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ModelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [model, setModel] = useState<ModelWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-32" />
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

  const bottleneck = model.stations.reduce((min, station) => {
    return station.machine.typical_uph < min.machine.typical_uph ? station : min;
  }, model.stations[0]);

  const uph = bottleneck?.machine.typical_uph || 0;

  const stationsByBoardType = model.board_types.reduce((acc, boardType) => {
    acc[boardType] = model.stations
      .filter(s => s.board_type === boardType)
      .sort((a, b) => a.sequence - b.sequence);
    return acc;
  }, {} as Record<string, typeof model.stations>);

  return (
    <PageTransition>
      <div className="space-y-6">
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

        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
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
          <StatsCard
            title="Target UPH"
            value={uph}
            icon={TrendingUp}
          />
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Bottleneck
                </p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {bottleneck?.machine.code || 'N/A'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {bottleneck?.machine.name}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {Object.entries(stationsByBoardType).map(([boardType, stations]) => (
          <motion.div
            key={boardType}
            variants={itemVariants}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {boardType} ({stations.length} stations)
              </h2>
              {stations.length > 0 && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Flow: {stations.map(s => s.machine.code).join(' → ')}
                </p>
              )}
            </div>

            {stations.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">MP</TableHead>
                      <TableHead className="text-right">UPH</TableHead>
                      <TableHead className="text-right">Cycle Time (s)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stations.map((station, index) => {
                      const isBottleneck = station.machine.id === bottleneck?.machine.id;
                      return (
                        <TableRow key={station.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-mono font-medium">
                            {station.machine.code}
                            {isBottleneck && (
                              <span className="ml-2 text-warning">🔴</span>
                            )}
                          </TableCell>
                          <TableCell>{station.machine.name}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {station.manpower}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {station.machine.typical_uph}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {station.machine.typical_cycle_time_sec}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                No stations configured for this board type
              </div>
            )}
          </motion.div>
        ))}
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
