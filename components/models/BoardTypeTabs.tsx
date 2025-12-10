'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  CircuitBoard, 
  Lightbulb, 
  Usb, 
  Radio, 
  Banknote,
  LayoutGrid,
  Factory,
  Users,
  TrendingUp,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BoardVariant, getBoardStations, formatRupiah } from '@/lib/api/model-groups';

// Board type icons
const boardTypeIcons: Record<string, React.ElementType> = {
  'Main Board': Cpu,
  'Sub Board': CircuitBoard,
  'LED Board': Lightbulb,
  'USB Board': Usb,
  'SUB_ANT Board': Radio,
  'Power Board': Banknote,
  'Display Board': LayoutGrid,
  'Sensor Board': Radio,
  'RF Board': Radio,
};

interface BoardTypeTabsProps {
  boards: BoardVariant[];
  totalInvestment: number;
}

interface StationData {
  id: string;
  stationCode: string;
  stationName: string;
  category?: string;
  sequence: number;
  manpower: number;
  cycleTime?: number;
  area?: string;
}

export function BoardTypeTabs({ boards, totalInvestment }: BoardTypeTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stationsCache, setStationsCache] = useState<Record<string, StationData[]>>({});
  const [loadingStations, setLoadingStations] = useState<string | null>(null);

  // Load stations for a board (lazy loading)
  const loadBoardStations = async (boardId: string) => {
    if (stationsCache[boardId]) return; // Already cached
    
    setLoadingStations(boardId);
    try {
      const stations = await getBoardStations(boardId);
      setStationsCache(prev => ({ ...prev, [boardId]: stations }));
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setLoadingStations(null);
    }
  };

  // Load stations when tab changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      const board = boards.find(b => b.id === activeTab);
      if (board) {
        loadBoardStations(board.id);
      }
    }
  }, [activeTab, boards]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        <TabsTrigger value="overview" className="whitespace-nowrap">
          <LayoutGrid className="w-4 h-4 mr-2" />
          Overview
        </TabsTrigger>
        {boards.map((board) => {
          const Icon = boardTypeIcons[board.boardType] || CircuitBoard;
          return (
            <TabsTrigger 
              key={board.id} 
              value={board.id}
              className="whitespace-nowrap"
            >
              <Icon className="w-4 h-4 mr-2" />
              {board.boardType.replace(' Board', '')}
              {board.emmcSize && (
                <span className="ml-1 text-xs opacity-70">
                  ({board.emmcSize}/{board.ramSize})
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="mt-6">
        <div className="space-y-6">
          {/* Investment Summary */}
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-800">
            <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-4">
              Investment Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Investment</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatRupiah(totalInvestment)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Boards</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {boards.length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Stations</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {boards.reduce((sum, b) => sum + b.stationCount, 0)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Manpower</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {boards.reduce((sum, b) => sum + b.totalManpower, 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Boards Comparison Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Board Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Board Type</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Stations</TableHead>
                    <TableHead className="text-right">Manpower</TableHead>
                    <TableHead className="text-right">Investment</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {boards.map((board) => {
                    const Icon = boardTypeIcons[board.boardType] || CircuitBoard;
                    const percentage = totalInvestment > 0 
                      ? ((board.investment / totalInvestment) * 100).toFixed(1)
                      : '0';
                    return (
                      <TableRow 
                        key={board.id}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        onClick={() => setActiveTab(board.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{board.boardType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {board.emmcSize && board.ramSize ? (
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {board.emmcSize} / {board.ramSize}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {board.stationCount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {board.totalManpower}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatRupiah(board.investment)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-primary-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm tabular-nums w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Individual Board Tabs */}
      {boards.map((board) => {
        const Icon = boardTypeIcons[board.boardType] || CircuitBoard;
        const stations = stationsCache[board.id] || [];
        const isLoading = loadingStations === board.id;

        return (
          <TabsContent key={board.id} value={board.id} className="mt-6">
            <div className="space-y-6">
              {/* Board Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {board.boardType}
                      </h3>
                      {board.emmcSize && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {board.emmcSize} eMMC / {board.ramSize} RAM
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Investment</p>
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      {formatRupiah(board.investment)}
                    </p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <Factory className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {board.stationCount}
                      </p>
                      <p className="text-sm text-slate-500">Stations</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {board.totalManpower}
                      </p>
                      <p className="text-sm text-slate-500">Manpower</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {board.uph || '-'}
                      </p>
                      <p className="text-sm text-slate-500">UPH</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stations Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Station List
                  </h3>
                  {stations.length > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      Flow: {stations.map(s => s.stationCode).join(' → ')}
                    </p>
                  )}
                </div>

                {isLoading ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
                    <p className="text-slate-500">Loading stations...</p>
                  </div>
                ) : stations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">#</TableHead>
                          <TableHead>Station Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Area</TableHead>
                          <TableHead className="text-right">Manpower</TableHead>
                          <TableHead className="text-right">Cycle Time (s)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stations.map((station, index) => (
                          <TableRow key={station.id}>
                            <TableCell className="font-medium text-slate-500">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {station.stationCode}
                            </TableCell>
                            <TableCell>{station.stationName}</TableCell>
                            <TableCell>
                              {station.area || '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {station.manpower}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {station.cycleTime || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    No stations configured for this board
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
