'use client';

import { useState, useMemo } from 'react';
import { Table2, Check, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ParsedTable,
  ColumnMapping,
  ColumnRole,
  ExtractionConfig,
  ExtractionResult,
} from '@/lib/excel-parser/types';
import { extractStations } from '@/lib/excel-parser/extractor';

interface TablePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: ParsedTable | null;
  initialColumns: ColumnMapping[];
  onConfirm: (result: ExtractionResult) => void;
}

const ROLE_OPTIONS: { value: ColumnRole; label: string }[] = [
  { value: 'station_name', label: 'Station Name *' },
  { value: 'status', label: 'Status (Filter)' },
  { value: 'section', label: 'Section / Board Type' },
  { value: 'description', label: 'Description' },
  { value: 'sequence', label: 'Sequence No.' },
  { value: 'process_code', label: 'Process Code' },
  { value: 'ignore', label: 'Ignore' },
];

export function TablePreviewModal({
  open,
  onOpenChange,
  table,
  initialColumns,
  onConfirm,
}: TablePreviewModalProps) {
  const [columns, setColumns] = useState<ColumnMapping[]>(initialColumns);
  const [statusFilterValue, setStatusFilterValue] = useState('1');
  const [filterByStatus, setFilterByStatus] = useState(true);

  // Reset columns when initialColumns change
  useMemo(() => {
    if (initialColumns.length > 0) {
      setColumns(initialColumns);
    }
  }, [initialColumns]);

  if (!table) return null;

  // Find assigned columns
  const stationNameCol = columns.find((c) => c.role === 'station_name')?.index ?? null;
  const statusCol = columns.find((c) => c.role === 'status')?.index ?? null;
  const sectionCol = columns.find((c) => c.role === 'section')?.index ?? null;

  // Preview extraction
  const preview = useMemo(() => {
    if (stationNameCol === null || !table) return null;

    const config: ExtractionConfig = {
      stationNameColumn: stationNameCol,
      statusColumn: filterByStatus ? statusCol : null,
      statusFilterValue,
      sectionColumn: sectionCol,
      skipHeaderRows: 1,
      includeDescription: false,
    };

    return extractStations(table, config);
  }, [table, stationNameCol, statusCol, sectionCol, filterByStatus, statusFilterValue]);

  // Update column role
  const updateColumnRole = (index: number, role: ColumnRole) => {
    setColumns((prev) =>
      prev.map((c) => (c.index === index ? { ...c, role } : c))
    );
  };

  // Handle confirm
  const handleConfirm = () => {
    if (preview) {
      onConfirm(preview);
      onOpenChange(false);
    }
  };

  // Check if row will be included
  const willIncludeRow = (rowIndex: number): boolean => {
    if (!filterByStatus || statusCol === null) return true;
    const status = table.rows[rowIndex]?.cells[statusCol];
    return status === statusFilterValue;
  };

  // Get highlight class for a column based on role
  const getColumnHighlight = (colIndex: number): string => {
    const col = columns.find((c) => c.index === colIndex);
    if (!col) return '';
    switch (col.role) {
      case 'station_name':
        return 'bg-primary/10';
      case 'status':
        return 'bg-green-500/10';
      case 'section':
        return 'bg-amber-500/10';
      case 'description':
        return 'bg-blue-500/10';
      default:
        return '';
    }
  };

  // Preview data (max 10 rows)
  const previewRows = table.rows.slice(0, 10);
  const hasMoreRows = table.rows.length > 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table2 className="w-5 h-5" />
            Excel Table Preview ({table.columnCount} columns x {table.rowCount} rows)
          </DialogTitle>
          <DialogDescription>
            We detected tabular data. Please verify column mapping and status filter.
          </DialogDescription>
        </DialogHeader>

        {/* Column Mapping */}
        <div className="space-y-3 py-2 border-b">
          <h4 className="text-sm font-medium">Column Mapping</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {columns.slice(0, 8).map((col) => (
              <div key={col.index} className="space-y-1">
                <Label className="text-xs text-muted-foreground truncate block" title={col.header}>
                  {col.header || `Col ${col.index + 1}`}
                  {col.confidence >= 0.8 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                      Auto
                    </Badge>
                  )}
                </Label>
                <Select
                  value={col.role}
                  onValueChange={(v) => updateColumnRole(col.index, v as ColumnRole)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        {statusCol !== null && (
          <div className="flex items-center gap-4 py-2 px-3 bg-muted/50 rounded">
            <Checkbox
              id="filterStatus"
              checked={filterByStatus}
              onCheckedChange={(c) => setFilterByStatus(!!c)}
            />
            <Label htmlFor="filterStatus" className="text-sm cursor-pointer">
              Filter by Status column (only include rows where status =
            </Label>
            {filterByStatus && (
              <Select value={statusFilterValue} onValueChange={setStatusFilterValue}>
                <SelectTrigger className="h-7 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="true">true</SelectItem>
                </SelectContent>
              </Select>
            )}
            <span className="text-sm">)</span>
          </div>
        )}

        {/* Table Preview */}
        <ScrollArea className="flex-1 border rounded max-h-[250px]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left font-medium border-b w-16">Include</th>
                {columns.map((col) => (
                  <th
                    key={col.index}
                    className={cn(
                      'px-3 py-2 text-left font-medium border-b',
                      getColumnHighlight(col.index)
                    )}
                  >
                    <div className="truncate max-w-[120px]" title={col.header}>
                      {col.header || `Col ${col.index + 1}`}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => {
                const included = willIncludeRow(idx);
                return (
                  <tr
                    key={idx}
                    className={cn(
                      'border-b last:border-b-0',
                      !included && 'opacity-40 bg-muted/30'
                    )}
                  >
                    <td className="px-2 py-1.5">
                      {included ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </td>
                    {row.cells.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className={cn(
                          'px-3 py-1.5',
                          getColumnHighlight(colIdx)
                        )}
                      >
                        <span className="truncate block max-w-[120px]" title={cell}>
                          {cell || '-'}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {hasMoreRows && (
                <tr className="text-muted-foreground text-center">
                  <td colSpan={columns.length + 1} className="px-3 py-2 text-xs">
                    ... and {table.rows.length - 10} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>

        {/* Extraction Preview */}
        {preview && (
          <div className="p-3 bg-muted/50 rounded space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Extraction Preview</h4>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {preview.includedRows} stations
                </span>
                <span className="text-muted-foreground">
                  {preview.skippedRows} skipped
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {preview.stations.slice(0, 12).map((s, i) => (
                <Badge key={i} variant="secondary" className="font-mono text-xs">
                  {s.name}
                </Badge>
              ))}
              {preview.stations.length > 12 && (
                <Badge variant="outline" className="text-xs">
                  +{preview.stations.length - 12} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Validation Warning */}
        {stationNameCol === null && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Please select a Station Name column</span>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={stationNameCol === null || !preview?.stations.length}
          >
            <Check className="w-4 h-4 mr-2" />
            Import {preview?.stations.length || 0} Stations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
