'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Search, ArrowRight, RotateCcw, AlertCircle, Table2, List } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TablePreviewModal } from '@/components/rfq/TablePreviewModal';
import { StationResolutionTable, ResolutionSummaryCompact } from '@/components/rfq/StationResolutionTable';
import {
  detectInputType,
  parseTable,
  mergeMultiRowHeaders,
  detectColumns,
  getUniqueStationNames,
  extractSimpleList,
} from '@/lib/excel-parser';
import type {
  ParsedTable,
  ColumnMapping,
  ExtractionResult,
  InputType,
} from '@/lib/excel-parser';
import type { ResolutionResult } from '@/lib/rfq';

interface SmartPasteStepProps {
  data: any;
  onChange: (data: any) => void;
}

type StepPhase = 'input' | 'resolving' | 'results';

export function SmartPasteStep({ data, onChange }: SmartPasteStepProps) {
  // Input state
  const [inputText, setInputText] = useState<string>(data?.rawInputText || '');
  const [detectedType, setDetectedType] = useState<InputType | null>(null);
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [parsedTable, setParsedTable] = useState<ParsedTable | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // Processing state
  const [phase, setPhase] = useState<StepPhase>('input');
  const [isResolving, setIsResolving] = useState(false);

  // Results state
  const [resolution, setResolution] = useState<ResolutionResult | null>(
    data?.resolution || null
  );

  // Handle input change with auto-detection
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);

    if (text.trim()) {
      const detection = detectInputType(text);
      setDetectedType(detection.type);
    } else {
      setDetectedType(null);
    }
  }, []);

  // Handle paste event for auto-detection
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const detection = detectInputType(text);

    // If Excel table detected with high confidence, show preview
    if (detection.type === 'excel_table' && detection.confidence > 0.7) {
      e.preventDefault();
      setInputText(text);
      setDetectedType('excel_table');

      // Parse and show preview
      let table = parseTable(text);
      table = mergeMultiRowHeaders(table);
      const columns = detectColumns(table);

      setParsedTable(table);
      setColumnMappings(columns.columns);
      setShowTablePreview(true);
    }
  }, []);

  // Handle manual detect/preview button click
  const handleDetect = useCallback(() => {
    if (!inputText.trim()) return;

    const detection = detectInputType(inputText);

    if (detection.type === 'excel_table') {
      let table = parseTable(inputText);
      table = mergeMultiRowHeaders(table);
      const columns = detectColumns(table);

      setParsedTable(table);
      setColumnMappings(columns.columns);
      setShowTablePreview(true);
    }
  }, [inputText]);

  // Handle table preview confirmation
  const handleTableConfirm = useCallback(async (result: ExtractionResult) => {
    setShowTablePreview(false);

    // Get unique station names
    const stationNames = getUniqueStationNames(result);

    if (stationNames.length === 0) {
      toast.error('No stations extracted from the table');
      return;
    }

    toast.success(`Extracted ${stationNames.length} unique stations`);

    // Auto-resolve the extracted stations
    await resolveStations(stationNames);
  }, []);

  // Resolve stations
  const resolveStations = useCallback(async (stationNames?: string[]) => {
    const names = stationNames || extractStationsFromInput();

    if (names.length === 0) {
      toast.error('No stations found in the input');
      return;
    }

    setIsResolving(true);
    setPhase('resolving');

    try {
      // Call API to resolve stations
      const response = await fetch('/api/rfq/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType: 'manual',
          stations: names.map(name => ({ input: name })),
          customerId: data?.customerId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to resolve stations');
      }

      setResolution(result.resolution);
      setPhase('results');

      // Update parent state
      onChange({
        rawInputText: inputText,
        parsedStations: names.map(n => ({ input: n })),
        resolution: result.resolution,
        inputSource: detectedType || 'manual',
      });

      toast.success(
        `Resolved ${result.resolution.summary.resolved}/${result.resolution.summary.total} stations`
      );
    } catch (error) {
      console.error('Resolution error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resolve stations');
      setPhase('input');
    } finally {
      setIsResolving(false);
    }
  }, [inputText, detectedType, data?.customerId, onChange]);

  // Extract stations from input based on detected type
  const extractStationsFromInput = useCallback((): string[] => {
    if (!inputText.trim()) return [];

    const detection = detectInputType(inputText);

    if (detection.type === 'simple_list' || detection.type === 'inline_list') {
      return extractSimpleList(inputText, detection.type);
    }

    // For excel table without preview, try simple extraction
    return inputText
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50);
  }, [inputText]);

  // Handle resolve button click
  const handleResolve = useCallback(async () => {
    if (!inputText.trim()) {
      toast.error('Please enter station data first');
      return;
    }

    const detection = detectInputType(inputText);

    // If Excel table, show preview first
    if (detection.type === 'excel_table' && detection.confidence > 0.7) {
      handleDetect();
      return;
    }

    // Otherwise, direct resolve
    await resolveStations();
  }, [inputText, handleDetect, resolveStations]);

  // Reset to input phase
  const handleReset = useCallback(() => {
    setPhase('input');
    setResolution(null);
    onChange({
      rawInputText: inputText,
      parsedStations: null,
      resolution: null,
    });
  }, [inputText, onChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Smart Paste
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Paste station data from Excel or enter manually - we&apos;ll auto-detect and resolve
        </p>
      </div>

      {/* Input Phase */}
      {phase === 'input' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Station Data</span>
              {detectedType && (
                <Badge variant="outline" className="gap-1">
                  {detectedType === 'excel_table' && <Table2 className="h-3 w-3" />}
                  {detectedType === 'simple_list' && <List className="h-3 w-3" />}
                  {detectedType === 'excel_table'
                    ? 'Excel Table Detected'
                    : detectedType === 'simple_list'
                    ? 'List Detected'
                    : detectedType === 'inline_list'
                    ? 'Inline List Detected'
                    : 'Unknown Format'}
                </Badge>
              )}
            </div>
            <Textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Paste from Excel or enter station names:

Examples:
• Excel table with columns (will auto-detect)
• One station per line: MBT, CAL, RFT1, RFT2
• Comma-separated: MBT, CAL, RFT1, RFT2`}
              className="min-h-[200px] font-mono text-sm"
              disabled={isResolving}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Supports: Excel copy-paste, comma-separated list, one per line
            </p>
            <div className="flex gap-2">
              {detectedType === 'excel_table' && (
                <Button
                  variant="outline"
                  onClick={handleDetect}
                  disabled={!inputText.trim()}
                  className="gap-2"
                >
                  <Table2 className="w-4 h-4" />
                  Preview Table
                </Button>
              )}
              <Button
                onClick={handleResolve}
                disabled={!inputText.trim() || isResolving}
                className="gap-2"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Resolve Stations
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resolving Phase */}
      {phase === 'resolving' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Resolving Stations...
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
            Using AI-powered matching to resolve station names to standard codes.
            This may take a few seconds.
          </p>
        </motion.div>
      )}

      {/* Results Phase */}
      {phase === 'results' && resolution && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <ResolutionSummaryCompact resolution={resolution} />
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Edit Input
            </Button>
          </div>

          {/* Results table */}
          <StationResolutionTable resolution={resolution} />

          {/* Warning for unresolved */}
          {resolution.summary.unresolved > 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {resolution.summary.unresolved} station(s) could not be resolved
                </h5>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  You can proceed anyway, or go back to edit your input.
                  Unresolved stations will be flagged for manual review.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Table Preview Modal */}
      <TablePreviewModal
        open={showTablePreview}
        onOpenChange={setShowTablePreview}
        table={parsedTable}
        initialColumns={columnMappings}
        onConfirm={handleTableConfirm}
      />
    </div>
  );
}
