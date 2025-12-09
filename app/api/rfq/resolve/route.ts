/**
 * RFQ Station Resolution API
 * POST /api/rfq/resolve
 *
 * Accepts station input and resolves to standard codes
 * using 3-level resolution (exact → alias → semantic)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseExcelFile,
  parseManualInput,
  resolveStations,
  validateParsedDocument,
} from '@/lib/rfq';
import type { ResolveResponse, DetectedColumns } from '@/lib/rfq';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let inputType: string;
    let text: string | undefined;
    let file: File | undefined;
    let columnMapping: DetectedColumns | undefined;
    let customerId: string | undefined;
    let filterEnabled = true;

    // Parse request based on content type
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      inputType = formData.get('inputType') as string;
      text = formData.get('text') as string | undefined;
      file = formData.get('file') as File | undefined;
      customerId = formData.get('customerId') as string | undefined;

      // Parse column mapping if provided
      const mappingStr = formData.get('columnMapping') as string | undefined;
      if (mappingStr) {
        try {
          columnMapping = JSON.parse(mappingStr);
        } catch {
          // Ignore invalid JSON
        }
      }

      // Parse filter flag
      const filterStr = formData.get('filterEnabled') as string | undefined;
      filterEnabled = filterStr !== 'false';
    } else {
      // JSON body
      const body = await request.json();
      inputType = body.inputType;
      text = body.text;
      columnMapping = body.columnMapping;
      customerId = body.customerId;
      filterEnabled = body.filterEnabled !== false;
    }

    // Validate input type
    if (!inputType || !['excel', 'manual'].includes(inputType)) {
      return NextResponse.json<ResolveResponse>(
        { success: false, error: 'Invalid input type. Use "excel" or "manual"' },
        { status: 400 }
      );
    }

    // Parse document based on input type
    let parsed;

    if (inputType === 'excel' && file) {
      parsed = await parseExcelFile(file);
    } else if (inputType === 'manual' && text) {
      parsed = parseManualInput(text, columnMapping);

      // Apply filter if using custom column mapping
      if (columnMapping && !filterEnabled) {
        // Re-parse without filtering
        const { detectPastedData, parseFromDetection } = await import('@/lib/rfq');
        const detection = detectPastedData(text);
        if (detection.isTabular) {
          // Override status column to disable filtering
          const noFilterMapping = { ...columnMapping, status: null };
          parsed = parseFromDetection(detection, noFilterMapping);
        }
      }
    } else {
      return NextResponse.json<ResolveResponse>(
        { success: false, error: 'Missing required input (file or text)' },
        { status: 400 }
      );
    }

    // Validate parsed document
    const validation = validateParsedDocument(parsed);
    if (!validation.isValid) {
      return NextResponse.json<ResolveResponse>(
        { success: false, error: validation.errors.join('; ') },
        { status: 400 }
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Parsing warnings:', validation.warnings);
    }

    // Resolve stations
    const resolution = await resolveStations(parsed.stations, customerId);

    return NextResponse.json<ResolveResponse>({
      success: true,
      parsed,
      resolution,
    });
  } catch (error) {
    console.error('RFQ resolve error:', error);

    const message = error instanceof Error ? error.message : 'Failed to process input';

    return NextResponse.json<ResolveResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check API health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/rfq/resolve',
    methods: ['POST'],
    description: 'Resolve station names to standard codes',
    inputTypes: ['excel', 'manual'],
  });
}
