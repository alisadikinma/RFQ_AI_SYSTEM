/**
 * Excel Parse API
 * Parse and analyze Excel table structure for station extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectInputType } from '@/lib/excel-parser/detector';
import { parseTable, mergeMultiRowHeaders } from '@/lib/excel-parser/table-parser';
import { detectColumns, validateDetection } from '@/lib/excel-parser/column-detector';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }

    // Detect input type
    const detection = detectInputType(input);

    if (detection.type !== 'excel_table') {
      return NextResponse.json({
        success: true,
        type: detection.type,
        confidence: detection.confidence,
        message: 'Not an Excel table format',
        suggestion:
          detection.type === 'simple_list'
            ? 'Use simple list processing'
            : detection.type === 'inline_list'
            ? 'Use inline list processing'
            : 'Try pasting directly from Excel',
      });
    }

    // Parse table
    let table = parseTable(input);
    table = mergeMultiRowHeaders(table);

    // Detect columns
    const columnDetection = detectColumns(table);
    const validation = validateDetection(columnDetection);

    return NextResponse.json({
      success: true,
      type: 'excel_table',
      confidence: detection.confidence,
      table: {
        headers: table.headers,
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        sampleRows: table.rows.slice(0, 5).map((r) => r.cells),
      },
      columns: columnDetection,
      validation,
    });
  } catch (error) {
    console.error('Parse Excel error:', error);
    return NextResponse.json(
      { error: 'Failed to parse Excel data' },
      { status: 500 }
    );
  }
}
