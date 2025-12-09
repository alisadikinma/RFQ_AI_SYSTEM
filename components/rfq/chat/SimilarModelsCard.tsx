/**
 * Similar Models Card Component
 * Displays similar model matches with similarity scores
 */

'use client';

import { useState } from 'react';
import { Award, ChevronRight, Users, Layers, Check, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SimilarModel } from './types';

interface SimilarModelsCardProps {
  models: SimilarModel[];
  queryStations: string[];
  onSelectModel: (model: SimilarModel) => void;
  className?: string;
}

function getRankIcon(index: number) {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `#${index + 1}`;
}

function getSimilarityColor(similarity: number) {
  if (similarity >= 80) return 'text-green-500';
  if (similarity >= 60) return 'text-yellow-500';
  return 'text-orange-500';
}

function getSimilarityBg(similarity: number) {
  if (similarity >= 80) return 'bg-green-500/10 border-green-500/30';
  if (similarity >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
  return 'bg-orange-500/10 border-orange-500/30';
}

export function SimilarModelsCard({
  models,
  queryStations,
  onSelectModel,
  className,
}: SimilarModelsCardProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (models.length === 0) {
    return (
      <div className={cn('rounded-lg border border-muted p-4 text-center', className)}>
        <p className="text-muted-foreground">Tidak ditemukan model serupa</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium">
        <Award className="h-4 w-4 text-primary" />
        <span>Top {models.length} Model Serupa</span>
        <span className="text-muted-foreground">
          (dari {queryStations.length} station)
        </span>
      </div>

      {/* Model Cards */}
      <div className="space-y-2">
        {models.map((model, index) => (
          <div
            key={model.id}
            className={cn(
              'rounded-lg border transition-all cursor-pointer',
              getSimilarityBg(model.similarity),
              expanded === model.id && 'ring-2 ring-primary'
            )}
          >
            {/* Main Row */}
            <div
              className="flex items-center gap-3 p-3"
              onClick={() => setExpanded(expanded === model.id ? null : model.id)}
            >
              {/* Rank */}
              <span className="text-lg">{getRankIcon(index)}</span>

              {/* Model Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{model.code}</span>
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {model.customer}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {model.name || model.code}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1" title="Total Stations">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{model.total_stations}</span>
                </div>
                <div className="flex items-center gap-1" title="Total Manpower">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{model.total_manpower}</span>
                </div>
              </div>

              {/* Similarity Score */}
              <div
                className={cn(
                  'text-lg font-bold tabular-nums',
                  getSimilarityColor(model.similarity)
                )}
              >
                {model.similarity}%
              </div>

              {/* Expand Icon */}
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
                  expanded === model.id && 'rotate-90'
                )}
              />
            </div>

            {/* Expanded Details */}
            {expanded === model.id && (
              <div className="border-t border-dashed px-3 py-3 space-y-3">
                {/* Station Match Summary */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="flex items-center gap-1 text-green-500 mb-1">
                      <Check className="h-3.5 w-3.5" />
                      <span className="font-medium">Matched ({model.matched_stations.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {model.matched_stations.slice(0, 8).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 bg-green-500/20 text-green-600 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))}
                      {model.matched_stations.length > 8 && (
                        <span className="text-xs text-muted-foreground">
                          +{model.matched_stations.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 text-red-500 mb-1">
                      <X className="h-3.5 w-3.5" />
                      <span className="font-medium">Missing ({model.missing_stations.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {model.missing_stations.slice(0, 8).map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 bg-red-500/20 text-red-600 rounded text-xs"
                        >
                          {s}
                        </span>
                      ))}
                      {model.missing_stations.length > 8 && (
                        <span className="text-xs text-muted-foreground">
                          +{model.missing_stations.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Detail Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectModel(model);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Eye className="h-4 w-4" />
                  Lihat Detail & Comparison
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
