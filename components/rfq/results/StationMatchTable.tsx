'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StationMatchTableProps {
  stationDetails: any[];
}

export function StationMatchTable({ stationDetails }: StationMatchTableProps) {
  const [expandedBoards, setExpandedBoards] = useState<string[]>([
    stationDetails[0]?.boardType || ''
  ]);

  const toggleBoard = (boardType: string) => {
    if (expandedBoards.includes(boardType)) {
      setExpandedBoards(expandedBoards.filter((b) => b !== boardType));
    } else {
      setExpandedBoards([...expandedBoards, boardType]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        📋 Station Matching Analysis
      </h3>

      {stationDetails.map((board, boardIndex) => {
        const isExpanded = expandedBoards.includes(board.boardType);
        const matchedCount = board.stations.filter((s: any) => s.match).length;
        const totalCount = board.stations.length;
        const matchPercentage = Math.round((matchedCount / totalCount) * 100);

        return (
          <motion.div
            key={boardIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: boardIndex * 0.1 }}
            className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleBoard(board.boardType)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {board.boardType}
                </span>
                <Badge variant="secondary">
                  {matchedCount}/{totalCount} matched
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {matchPercentage}%
                </span>
                <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      matchPercentage === 100
                        ? 'bg-success'
                        : matchPercentage >= 75
                        ? 'bg-primary-500'
                        : matchPercentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
              </div>
            </button>

            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Your Station</TableHead>
                        <TableHead className="text-center">Match</TableHead>
                        <TableHead>Historical</TableHead>
                        <TableHead className="text-right">MP</TableHead>
                        <TableHead className="text-right">UPH</TableHead>
                        <TableHead className="text-right">Cycle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {board.stations.map((station: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {station.yourStation}
                          </TableCell>
                          <TableCell className="text-center">
                            {station.match ? (
                              <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell>
                            {station.match ? (
                              station.historical
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {station.mp || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {station.uph || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {station.cycle || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {board.stations.some((s: any) => s.isNew) && (
                    <div className="mt-4 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                          New Station Detected
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Some stations are not in the reference model. Investment estimation may need manual review.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
