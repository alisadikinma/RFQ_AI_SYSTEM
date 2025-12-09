'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Edit,
} from 'lucide-react';
import type { ExtractedStation } from '@/lib/excel-parser/types';

interface ExtractionResultProps {
  stations: ExtractedStation[];
  skipped?: number;
  onProceed: () => void;
  onModify?: () => void;
}

export function ExtractionResult({
  stations,
  skipped = 0,
  onProceed,
  onModify,
}: ExtractionResultProps) {
  const [expanded, setExpanded] = useState(false);

  // Group by section if available
  const sections = stations.reduce(
    (acc, s) => {
      const section = s.section || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push(s);
      return acc;
    },
    {} as Record<string, ExtractedStation[]>
  );

  const hasSections = Object.keys(sections).length > 1;

  return (
    <Card className="mt-4 border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">
            Extracted {stations.length} stations
          </span>
          {skipped > 0 && (
            <span className="text-sm text-muted-foreground">
              ({skipped} skipped - Status=0)
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {/* Preview */}
        <div className="flex flex-wrap gap-1.5">
          {stations.slice(0, expanded ? undefined : 10).map((s, i) => (
            <Badge key={i} variant="secondary" className="font-mono">
              {s.name}
            </Badge>
          ))}
          {!expanded && stations.length > 10 && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => setExpanded(true)}
            >
              +{stations.length - 10} more
            </Badge>
          )}
        </div>

        {/* Expanded: Show by section */}
        {expanded && hasSections && (
          <div className="mt-4 space-y-3">
            {Object.entries(sections).map(([section, items]) => (
              <div key={section}>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {section}
                </p>
                <div className="flex flex-wrap gap-1">
                  {items.map((s, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-sm text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View details
            </>
          )}
        </button>
      </CardContent>

      <CardFooter className="gap-2">
        {onModify && (
          <Button variant="outline" size="sm" onClick={onModify}>
            <Edit className="h-4 w-4 mr-1" />
            Modify
          </Button>
        )}
        <Button size="sm" onClick={onProceed}>
          Continue to Comparison
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
