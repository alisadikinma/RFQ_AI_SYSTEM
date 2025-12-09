/**
 * Model Comparison Modal
 * Shows detailed comparison between query and selected model
 */

'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Users,
  Layers,
  Clock,
  Check,
  Minus,
  Plus,
  ArrowRight,
  Download,
  Loader2,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimilarModel, InferredStation } from './types';

interface ModelComparisonModalProps {
  model: SimilarModel;
  queryStations: string[];
  onClose: () => void;
  onUseModel: (model: SimilarModel) => void;
}

interface ModelDetails {
  id: string;
  code: string;
  name: string;
  customer: string;
  customer_code: string;
  board_types: string[];
  summary: {
    total_stations: number;
    total_manpower: number;
    total_cycle_time: number;
    board_count: number;
  };
  stations_by_board: Record<string, Array<{
    code: string;
    name: string;
    category: string;
    sequence: number;
    manpower: number;
    cycle_time: number;
  }>>;
}

export function ModelComparisonModal({
  model,
  queryStations,
  onClose,
  onUseModel,
}: ModelComparisonModalProps) {
  const [details, setDetails] = useState<ModelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBoard, setActiveBoard] = useState<string>('All');

  // Fetch model details
  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch('/api/rfq/model-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId: model.id }),
        });
        
        if (!res.ok) throw new Error('Failed to fetch details');
        
        const data = await res.json();
        if (data.success) {
          setDetails({
            ...data.model,
            summary: data.summary,
            stations_by_board: data.stations_by_board,
          });
        } else {
          throw new Error(data.error || 'Failed to load');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDetails();
  }, [model.id]);

  // Create comparison data
  const allModelStations = details 
    ? Object.values(details.stations_by_board).flat()
    : model.all_stations.map(code => ({ code, name: code, category: '', sequence: 0, manpower: 0, cycle_time: 0 }));
  
  const filteredStations = activeBoard === 'All' 
    ? allModelStations
    : details?.stations_by_board[activeBoard] || [];

  // Station comparison
  const comparisonRows = (() => {
    const allCodes = new Set([
      ...queryStations,
      ...(details ? allModelStations.map(s => s.code) : model.all_stations),
    ]);
    
    return Array.from(allCodes).map(code => {
      const inQuery = queryStations.some(q => 
        q.toUpperCase().includes(code.toUpperCase()) || 
        code.toUpperCase().includes(q.toUpperCase())
      );
      const modelStation = allModelStations.find(s => 
        s.code.toUpperCase().includes(code.toUpperCase()) ||
        code.toUpperCase().includes(s.code.toUpperCase())
      );
      const inModel = !!modelStation;
      
      return {
        code,
        inQuery,
        inModel,
        status: inQuery && inModel ? 'match' : inQuery ? 'missing' : 'extra',
        manpower: modelStation?.manpower || 0,
        cycleTime: modelStation?.cycle_time || 0,
        category: modelStation?.category || '',
      };
    }).sort((a, b) => {
      // Sort: match first, then missing, then extra
      const order = { match: 0, missing: 1, extra: 2 };
      return order[a.status] - order[b.status];
    });
  })();

  const matchCount = comparisonRows.filter(r => r.status === 'match').length;
  const missingCount = comparisonRows.filter(r => r.status === 'missing').length;
  const extraCount = comparisonRows.filter(r => r.status === 'extra').length;
  
  const totalMP = comparisonRows.reduce((sum, r) => sum + (r.status !== 'missing' ? r.manpower : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {model.code}
            </h2>
            <p className="text-sm text-muted-foreground">
              {model.customer} • Similarity: {model.similarity}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle className="h-6 w-6 mr-2" />
              {error}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground">Total Stations</div>
                  <div className="text-2xl font-bold">{details?.summary.total_stations || model.total_stations}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground">Total Manpower</div>
                  <div className="text-2xl font-bold">{details?.summary.total_manpower || model.total_manpower}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground">Match Rate</div>
                  <div className="text-2xl font-bold text-green-500">
                    {Math.round((matchCount / queryStations.length) * 100)}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground">Est. Cycle Time</div>
                  <div className="text-2xl font-bold">
                    {details?.summary.total_cycle_time || '-'}s
                  </div>
                </div>
              </div>

              {/* Board Type Tabs */}
              {details && Object.keys(details.stations_by_board).length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveBoard('All')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                      activeBoard === 'All'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    All Boards
                  </button>
                  {Object.keys(details.stations_by_board).map(board => (
                    <button
                      key={board}
                      onClick={() => setActiveBoard(board)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                        activeBoard === board
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      )}
                    >
                      {board}
                    </button>
                  ))}
                </div>
              )}

              {/* Comparison Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 flex items-center gap-4 text-sm font-medium border-b">
                  <span className="flex items-center gap-1 text-green-600">
                    <Check className="h-4 w-4" /> Match: {matchCount}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <Minus className="h-4 w-4" /> Missing: {missingCount}
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Plus className="h-4 w-4" /> Extra: {extraCount}
                  </span>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Station</th>
                        <th className="text-center px-4 py-2 font-medium w-24">Query</th>
                        <th className="text-center px-4 py-2 font-medium w-24">Model</th>
                        <th className="text-center px-4 py-2 font-medium w-20">MP</th>
                        <th className="text-left px-4 py-2 font-medium">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row, i) => (
                        <tr
                          key={row.code}
                          className={cn(
                            'border-t',
                            row.status === 'match' && 'bg-green-500/5',
                            row.status === 'missing' && 'bg-red-500/5',
                            row.status === 'extra' && 'bg-blue-500/5'
                          )}
                        >
                          <td className="px-4 py-2 font-mono">{row.code}</td>
                          <td className="text-center px-4 py-2">
                            {row.inQuery ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center px-4 py-2">
                            {row.inModel ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center px-4 py-2 tabular-nums">
                            {row.manpower || '-'}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {row.category || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2">📊 Ringkasan Perbandingan</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• {matchCount} dari {queryStations.length} station Anda ditemukan di model ini</li>
                  {missingCount > 0 && (
                    <li>• {missingCount} station Anda tidak ada di model: <span className="font-mono text-red-500">{comparisonRows.filter(r => r.status === 'missing').map(r => r.code).join(', ')}</span></li>
                  )}
                  {extraCount > 0 && (
                    <li>• Model memiliki {extraCount} station tambahan yang mungkin perlu ditambahkan</li>
                  )}
                  <li>• Estimasi total manpower jika pakai model ini: <span className="font-bold">{totalMP} orang</span></li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
          >
            Tutup
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {/* TODO: Export */}}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => onUseModel(model)}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              Gunakan Model Ini
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
