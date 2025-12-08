'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronRight, GripVertical, X, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ManualEntryStepProps {
  data: any;
  onChange: (data: any) => void;
}

const BOARD_TYPES = [
  'Main Board',
  'Sub Board',
  'RF Board',
  'SUB_UPPER',
  'SUB_LOWER',
  'Mic Board',
  'SUB_ANT',
  'Module',
  'LED Board',
  'SIM Board',
  'USB Board',
  'Wifi Board',
];

const STATION_OPTIONS = [
  'MBT',
  'CAL',
  'RFT',
  'RFT1',
  'RFT2',
  'FQC',
  'BLMMI',
  'T_GREASE',
  'SHIELD',
  'VISUAL',
  'SCREW',
  'LABEL',
];

export function ManualEntryStep({ data, onChange }: ManualEntryStepProps) {
  const [selectedBoards, setSelectedBoards] = useState<string[]>(
    data?.selectedBoards || ['Main Board', 'Sub Board']
  );
  const [expandedBoards, setExpandedBoards] = useState<string[]>(['Main Board']);
  const [stations, setStations] = useState<Record<string, any[]>>(
    data?.stations || {
      'Main Board': [
        { id: 1, station: 'MBT', description: 'Manual bench test' },
        { id: 2, station: 'CAL', description: 'Calibration station' },
      ],
      'Sub Board': [],
    }
  );

  useEffect(() => {
    onChange({ selectedBoards, stations });
  }, [selectedBoards, stations]);

  const toggleBoard = (board: string) => {
    if (selectedBoards.includes(board)) {
      setSelectedBoards(selectedBoards.filter((b) => b !== board));
      const newStations = { ...stations };
      delete newStations[board];
      setStations(newStations);
    } else {
      setSelectedBoards([...selectedBoards, board]);
      setStations({ ...stations, [board]: [] });
    }
  };

  const toggleExpand = (board: string) => {
    if (expandedBoards.includes(board)) {
      setExpandedBoards(expandedBoards.filter((b) => b !== board));
    } else {
      setExpandedBoards([...expandedBoards, board]);
    }
  };

  const addStation = (board: string) => {
    const newId = Date.now();
    setStations({
      ...stations,
      [board]: [
        ...stations[board],
        { id: newId, station: '', description: '' },
      ],
    });
  };

  const updateStation = (board: string, id: number, field: string, value: string) => {
    setStations({
      ...stations,
      [board]: stations[board].map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const removeStation = (board: string, id: number) => {
    setStations({
      ...stations,
      [board]: stations[board].filter((s) => s.id !== id),
    });
  };

  const moveStation = (board: string, id: number, direction: 'up' | 'down') => {
    const boardStations = stations[board];
    const index = boardStations.findIndex((s) => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === boardStations.length - 1)
    ) {
      return;
    }

    const newStations = [...boardStations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newStations[index], newStations[targetIndex]] = [
      newStations[targetIndex],
      newStations[index],
    ];

    setStations({ ...stations, [board]: newStations });
  };

  const addStationVariants = {
    initial: { opacity: 0, height: 0, y: -20 },
    animate: {
      opacity: 1,
      height: 'auto',
      y: 0,
      transition: { duration: 0.3 },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Select Board Types
        </h3>
        <div className="flex flex-wrap gap-2">
          {BOARD_TYPES.map((board) => (
            <Badge
              key={board}
              variant={selectedBoards.includes(board) ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => toggleBoard(board)}
            >
              {selectedBoards.includes(board) && '✓ '}
              {board}
            </Badge>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="space-y-4">
          {selectedBoards.map((board) => {
            const isExpanded = expandedBoards.includes(board);
            const boardStations = stations[board] || [];

            return (
              <div
                key={board}
                className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleExpand(board)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {board}
                    </span>
                    <Badge variant="secondary">
                      {boardStations.length} stations
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      addStation(board);
                      if (!isExpanded) toggleExpand(board);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Station
                  </Button>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3">
                        <AnimatePresence>
                          {boardStations.map((station, index) => (
                            <motion.div
                              key={station.id}
                              variants={addStationVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                            >
                              <div className="flex items-center gap-2 pt-2">
                                <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                                <span className="text-sm font-medium text-slate-500 min-w-[20px]">
                                  {index + 1}
                                </span>
                              </div>

                              <div className="flex-1 space-y-2">
                                <Select
                                  value={station.station}
                                  onValueChange={(value) =>
                                    updateStation(board, station.id, 'station', value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select station..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATION_OPTIONS.map((opt) => (
                                      <SelectItem key={opt} value={opt}>
                                        {opt}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Input
                                  placeholder="Description (optional)"
                                  value={station.description}
                                  onChange={(e) =>
                                    updateStation(
                                      board,
                                      station.id,
                                      'description',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveStation(board, station.id, 'up')}
                                  disabled={index === 0}
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => moveStation(board, station.id, 'down')}
                                  disabled={index === boardStations.length - 1}
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeStation(board, station.id)}
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {boardStations.length === 0 && (
                          <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">No stations added yet</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addStation(board)}
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add First Station
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
