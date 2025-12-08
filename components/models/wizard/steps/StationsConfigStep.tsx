'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, GripVertical, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMachines, type Machine } from '@/lib/api/stations';

interface Station {
  id: string;
  machineId: string;
  manpower: number;
}

interface StationsConfigStepProps {
  data: {
    boardTypes?: string[];
    stations?: Record<string, Station[]>;
  };
  onChange: (data: any) => void;
}

export function StationsConfigStep({ data, onChange }: StationsConfigStepProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(data.boardTypes?.[0] || '');

  useEffect(() => {
    const loadMachines = async () => {
      try {
        const machineData = await getMachines();
        setMachines(machineData);
      } catch (error) {
        console.error('Failed to load machines:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMachines();
  }, []);

  useEffect(() => {
    if (data.boardTypes?.length && !activeTab) {
      setActiveTab(data.boardTypes[0]);
    }
  }, [data.boardTypes, activeTab]);

  const boardTypes = data.boardTypes || [];
  const stations = data.stations || {};

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddStation = (boardType: string) => {
    const currentStations = stations[boardType] || [];
    const newStation: Station = {
      id: generateId(),
      machineId: '',
      manpower: 1,
    };
    onChange({
      ...data,
      stations: {
        ...stations,
        [boardType]: [...currentStations, newStation],
      },
    });
  };

  const handleRemoveStation = (boardType: string, stationId: string) => {
    const currentStations = stations[boardType] || [];
    onChange({
      ...data,
      stations: {
        ...stations,
        [boardType]: currentStations.filter(s => s.id !== stationId),
      },
    });
  };

  const handleUpdateStation = (boardType: string, stationId: string, updates: Partial<Station>) => {
    const currentStations = stations[boardType] || [];
    onChange({
      ...data,
      stations: {
        ...stations,
        [boardType]: currentStations.map(s =>
          s.id === stationId ? { ...s, ...updates } : s
        ),
      },
    });
  };

  const handleReorder = (boardType: string, newOrder: Station[]) => {
    onChange({
      ...data,
      stations: {
        ...stations,
        [boardType]: newOrder,
      },
    });
  };

  const getMachineById = (id: string) => machines.find(m => m.id === id);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Testing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Assembly':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Inspection':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (boardTypes.length === 0) {
    return (
      <div className="flex flex-col items-center py-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          No board types defined
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Please go back and add at least one board type
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Station Configuration
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Configure the production flow stations for each board type. Drag to reorder.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {boardTypes.map((type) => (
            <TabsTrigger key={type} value={type} className="gap-2">
              {type}
              <span className="text-xs bg-slate-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {(stations[type] || []).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {boardTypes.map((boardType) => (
          <TabsContent key={boardType} value={boardType} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Board Type: <span className="font-semibold">{boardType}</span>
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddStation(boardType)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Station
              </Button>
            </div>

            {(stations[boardType] || []).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center"
              >
                <p className="text-slate-500 dark:text-slate-400">
                  No stations added yet. Click "Add Station" to begin.
                </p>
              </motion.div>
            ) : (
              <Reorder.Group
                axis="y"
                values={stations[boardType] || []}
                onReorder={(newOrder) => handleReorder(boardType, newOrder)}
                className="space-y-2"
              >
                <AnimatePresence initial={false}>
                  {(stations[boardType] || []).map((station, index) => {
                    const machine = getMachineById(station.machineId);
                    return (
                      <Reorder.Item
                        key={station.id}
                        value={station}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <motion.div
                          className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                        >
                          <div className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-slate-400" />
                          </div>

                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold text-sm">
                            {index + 1}
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label className="text-xs text-slate-500 mb-1">Machine</Label>
                              <Select
                                value={station.machineId}
                                onValueChange={(value) =>
                                  handleUpdateStation(boardType, station.id, { machineId: value })
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select machine" />
                                </SelectTrigger>
                                <SelectContent>
                                  {machines.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium">{m.code}</span>
                                        <span className="text-slate-500">- {m.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs text-slate-500 mb-1">Manpower</Label>
                              <Input
                                type="number"
                                min="1"
                                value={station.manpower}
                                onChange={(e) =>
                                  handleUpdateStation(boardType, station.id, {
                                    manpower: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full"
                              />
                            </div>

                            <div>
                              <Label className="text-xs text-slate-500 mb-1">Details</Label>
                              {machine ? (
                                <div className="flex items-center gap-2 h-10">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(machine.category)}`}>
                                    {machine.category}
                                  </span>
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {machine.typical_uph} UPH
                                  </span>
                                </div>
                              ) : (
                                <div className="h-10 flex items-center text-sm text-slate-400">
                                  Select a machine
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveStation(boardType, station.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </Reorder.Item>
                    );
                  })}
                </AnimatePresence>
              </Reorder.Group>
            )}

            {(stations[boardType] || []).length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Summary for {boardType}:</strong>{' '}
                  {(stations[boardType] || []).length} stations,{' '}
                  {(stations[boardType] || []).reduce((sum, s) => sum + s.manpower, 0)} total manpower
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
