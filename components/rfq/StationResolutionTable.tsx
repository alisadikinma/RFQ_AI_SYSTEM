'use client';

import { useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ResolutionResult, ResolvedStation, ConfidenceLevel, MatchMethod } from '@/lib/rfq';

interface StationResolutionTableProps {
  resolution: ResolutionResult;
  showReasoning?: boolean;
  className?: string;
}

export function StationResolutionTable({
  resolution,
  showReasoning = true,
  className,
}: StationResolutionTableProps) {
  const { stations, summary } = resolution;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <ResolutionSummary summary={summary} />

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">Input</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[180px]">Resolved To</TableHead>
              <TableHead className="w-[100px]">Confidence</TableHead>
              <TableHead className="w-[100px]">Method</TableHead>
              {showReasoning && <TableHead>Reasoning</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stations.map((station, index) => (
              <StationRow
                key={index}
                station={station}
                showReasoning={showReasoning}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Unique codes summary */}
      {summary.uniqueCodes.length > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-medium mb-2">
            Unique Station Codes ({summary.uniqueCodes.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.uniqueCodes.map(code => (
              <Badge key={code} variant="secondary">
                {code}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Resolution summary component
 */
function ResolutionSummary({ summary }: { summary: ResolutionResult['summary'] }) {
  const { total, resolved, unresolved, byMethod } = summary;

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">{total}</span>
        </div>
        <span className="text-sm text-muted-foreground">Total stations</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
        <span className="text-sm">
          <strong>{resolved}</strong> resolved
        </span>
      </div>

      {unresolved > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-destructive" />
          </div>
          <span className="text-sm text-destructive">
            <strong>{unresolved}</strong> unresolved
          </span>
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          Exact: <strong>{byMethod.exact}</strong>
        </span>
        <span>
          Alias: <strong>{byMethod.alias}</strong>
        </span>
        <span>
          AI: <strong>{byMethod.semantic}</strong>
        </span>
      </div>
    </div>
  );
}

/**
 * Single station row component
 */
function StationRow({
  station,
  showReasoning,
}: {
  station: ResolvedStation;
  showReasoning: boolean;
}) {
  const isUnresolved = station.matchMethod === 'unresolved';

  return (
    <TableRow className={cn(isUnresolved && 'bg-destructive/5')}>
      {/* Input */}
      <TableCell>
        <div className="space-y-0.5">
          <span className="font-medium">{station.input}</span>
          {station.inputDescription && (
            <p className="text-xs text-muted-foreground truncate max-w-[180px]" title={station.inputDescription}>
              {station.inputDescription}
            </p>
          )}
        </div>
      </TableCell>

      {/* Arrow */}
      <TableCell>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </TableCell>

      {/* Resolved To */}
      <TableCell>
        {isUnresolved ? (
          <span className="text-destructive flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Unresolved
          </span>
        ) : (
          <div className="space-y-0.5">
            <span className="font-mono font-medium text-primary">
              {station.resolvedCode}
            </span>
            {station.resolvedName && (
              <p className="text-xs text-muted-foreground">
                {station.resolvedName}
              </p>
            )}
          </div>
        )}
      </TableCell>

      {/* Confidence */}
      <TableCell>
        <ConfidenceBadge confidence={station.confidence} />
      </TableCell>

      {/* Method */}
      <TableCell>
        <MethodBadge method={station.matchMethod} />
      </TableCell>

      {/* Reasoning */}
      {showReasoning && (
        <TableCell>
          {station.reasoning ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px] block cursor-help">
                    {station.reasoning}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <p className="text-sm">{station.reasoning}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}

/**
 * Confidence badge component
 */
function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const config: Record<ConfidenceLevel, { icon: React.ReactNode; label: string; className: string }> = {
    high: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'High',
      className: 'bg-green-500/10 text-green-600 border-green-500/30',
    },
    medium: {
      icon: <Info className="w-3 h-3" />,
      label: 'Medium',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    },
    low: {
      icon: <HelpCircle className="w-3 h-3" />,
      label: 'Low',
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    },
    none: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'None',
      className: 'bg-destructive/10 text-destructive border-destructive/30',
    },
  };

  const { icon, label, className } = config[confidence];

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      {icon}
      {label}
    </Badge>
  );
}

/**
 * Method badge component
 */
function MethodBadge({ method }: { method: MatchMethod }) {
  const config: Record<MatchMethod, { icon: React.ReactNode; label: string }> = {
    exact: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Exact',
    },
    alias: {
      icon: <Search className="w-3 h-3" />,
      label: 'Alias',
    },
    semantic: {
      icon: <Sparkles className="w-3 h-3" />,
      label: 'AI',
    },
    unresolved: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: '-',
    },
  };

  const { icon, label } = config[method];

  if (method === 'unresolved') {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <Badge variant="outline" className="gap-1">
      {icon}
      {label}
    </Badge>
  );
}

/**
 * Compact resolution summary for inline display
 */
export function ResolutionSummaryCompact({
  resolution,
}: {
  resolution: ResolutionResult;
}) {
  const { summary } = resolution;
  const successRate = Math.round((summary.resolved / summary.total) * 100);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">
        {summary.resolved}/{summary.total} resolved
      </span>
      <div className="flex items-center gap-1">
        {successRate >= 90 ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : successRate >= 70 ? (
          <Info className="w-4 h-4 text-amber-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-destructive" />
        )}
        <span className={cn(
          successRate >= 90 ? 'text-green-600' :
          successRate >= 70 ? 'text-amber-600' :
          'text-destructive'
        )}>
          {successRate}%
        </span>
      </div>
    </div>
  );
}
