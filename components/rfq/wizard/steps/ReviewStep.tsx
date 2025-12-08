'use client';

import { motion } from 'framer-motion';
import { Edit, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReviewStepProps {
  data: any;
  onEdit: (step: number) => void;
}

export function ReviewStep({ data, onEdit }: ReviewStepProps) {
  const getStationCount = () => {
    if (data.inputMethod === 'upload' && data.parsedData) {
      return data.parsedData.totalStations;
    }
    if (data.stations) {
      return Object.values(data.stations).reduce(
        (sum: number, stations: any) => sum + stations.length,
        0
      );
    }
    return 0;
  };

  const getBoardSummary = () => {
    if (data.inputMethod === 'upload' && data.parsedData) {
      return data.parsedData.boardTypes.map((boardType: string) => {
        const stations = data.parsedData.stations.filter(
          (s: any) => s.boardType === boardType
        );
        return {
          boardType,
          stations: stations.map((s: any) => s.mapped).join(', '),
          count: stations.length,
        };
      });
    }
    if (data.stations) {
      return Object.entries(data.stations).map(([boardType, stations]: [string, any]) => ({
        boardType,
        stations: stations.map((s: any) => s.station).join(', '),
        count: stations.length,
      }));
    }
    return [];
  };

  const getLowConfidenceMappings = () => {
    if (data.inputMethod === 'upload' && data.parsedData) {
      return data.parsedData.stations.filter((s: any) => s.confidence < 80);
    }
    return [];
  };

  const boardSummary = getBoardSummary();
  const lowConfidenceMappings = getLowConfidenceMappings();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Review Your RFQ Request
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Please review all information before submitting
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Customer Information
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(0)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Customer</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {data.customer || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Model Name</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {data.modelName || '-'}
              </p>
            </div>
          </div>

          {data.referenceModel && (
            <div>
              <p className="text-sm text-slate-500">Reference Model</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {data.referenceModel}{' '}
                <Badge variant="secondary" className="ml-2">
                  92% similar
                </Badge>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Target UPH</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {data.targetUPH ? `${data.targetUPH} units/hour` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Target Volume</p>
              <p className="font-medium text-slate-900 dark:text-white">
                {data.targetVolume ? `${data.targetVolume} units/month` : '-'}
              </p>
            </div>
          </div>

          {data.notes && (
            <div>
              <p className="text-sm text-slate-500">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {data.notes}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h4 className="font-semibold text-slate-900 dark:text-white">
            Stations Summary
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(2)}
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </Button>
        </div>

        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Board Type</TableHead>
                <TableHead>Stations</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardSummary.map((board: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{board.boardType}</TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {board.stations || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{board.count}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-slate-100 dark:bg-slate-800 font-semibold">
                <TableCell>TOTAL</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">
                  <Badge>{getStationCount()}</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </motion.div>

      {data.inputMethod === 'upload' && lowConfidenceMappings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                {lowConfidenceMappings.length} station{lowConfidenceMappings.length > 1 ? 's' : ''} need{lowConfidenceMappings.length === 1 ? 's' : ''} manual confirmation
              </h4>
              <div className="space-y-3">
                {lowConfidenceMappings.map((mapping: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-amber-200 dark:border-amber-800"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                      "{mapping.original}" was mapped to "{mapping.mapped}" with{' '}
                      {mapping.confidence}% confidence.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Yes, it's correct
                      </Button>
                      <Button size="sm" variant="outline">
                        Change
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {data.inputMethod === 'upload' && lowConfidenceMappings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-200">
              All station mappings are confident and ready for submission
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
