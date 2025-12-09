'use client';

import { useState, useCallback, ClipboardEvent } from 'react';
import { Lightbulb, Table2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { detectPastedData, isExcelPaste } from '@/lib/rfq';
import type { PasteDetectionResult } from '@/lib/rfq';

interface SmartPasteTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onTabularDetected?: (detection: PasteDetectionResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SmartPasteTextarea({
  value,
  onChange,
  onTabularDetected,
  placeholder = 'Enter station names or paste from Excel...',
  className,
  disabled,
}: SmartPasteTextareaProps) {
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [lastDetection, setLastDetection] = useState<PasteDetectionResult | null>(null);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');

    // Check if it looks like Excel paste
    if (isExcelPaste(pastedText)) {
      e.preventDefault();

      // Detect tabular data
      const detection = detectPastedData(pastedText);
      setLastDetection(detection);

      if (detection.isTabular && onTabularDetected) {
        // Update value with pasted text
        onChange(pastedText);

        // Trigger modal to show table preview
        onTabularDetected(detection);
      } else {
        // Not tabular enough, just paste normally
        onChange(pastedText);
      }
    }
  }, [onChange, onTabularDetected]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear detection if text is manually edited significantly
    if (lastDetection && Math.abs(newValue.length - value.length) > 10) {
      setLastDetection(null);
    }
  }, [onChange, lastDetection, value.length]);

  const handleFocus = useCallback(() => {
    setShowPasteHint(true);
  }, []);

  const handleBlur = useCallback(() => {
    setShowPasteHint(false);
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'min-h-[160px] resize-y font-mono text-sm',
            className
          )}
          disabled={disabled}
        />

        {/* Paste hint */}
        {showPasteHint && !value && (
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1.5 border border-dashed border-muted-foreground/30">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>
                <strong>TIP:</strong> Copy columns from Excel and paste here - we&apos;ll auto-detect the format!
              </span>
            </div>
          </div>
        )}

        {/* Detection indicator */}
        {lastDetection?.isTabular && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              <Table2 className="w-3 h-3" />
              <span>Table detected</span>
            </div>
          </div>
        )}
      </div>

      {/* Format examples */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Supported formats:</p>
        <ul className="list-disc list-inside space-y-0.5 pl-1">
          <li>Simple list: <code className="bg-muted px-1 rounded">MBT, CAL, RFT, MMI, VISUAL</code></li>
          <li>One per line: <code className="bg-muted px-1 rounded">MBT{'\n'}CAL{'\n'}RFT</code></li>
          <li>Excel paste: Copy columns directly from spreadsheet</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Simple version without smart paste detection
 */
export function SimpleTextarea({
  value,
  onChange,
  placeholder = 'Enter station names (comma or newline separated)',
  className,
  disabled,
}: Omit<SmartPasteTextareaProps, 'onTabularDetected'>) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('min-h-[120px] resize-y', className)}
        disabled={disabled}
      />
      <p className="text-xs text-muted-foreground">
        Enter station names separated by commas, semicolons, or newlines
      </p>
    </div>
  );
}
