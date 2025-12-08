/**
 * File Parse API Route
 * POST /api/parse - Parse uploaded files (BOM, PCB specs)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  parseUploadedFile,
  parseWithLLM,
  isFileSupported,
  getFileCategory
} from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const forceLLM = formData.get('forceLLM') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isFileSupported(file.name)) {
      return NextResponse.json(
        {
          error: 'Unsupported file type',
          details: 'Supported formats: .xlsx, .xls, .csv, .pdf'
        },
        { status: 400 }
      );
    }

    // Parse the file
    const result = forceLLM
      ? await parseWithLLM(file)
      : await parseUploadedFile(file);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to parse file',
          details: result.error
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      file_name: file.name,
      file_size: file.size,
      file_category: getFileCategory(file.name),
      parsed_at: new Date().toISOString(),
      data: {
        bom: result.bom || null,
        pcb: result.pcb || null,
        inferred_features: result.inferred_features || null,
      }
    });

  } catch (error) {
    console.error('Parse API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'File Parse API',
    version: '1.0.0',
    endpoints: {
      'POST /api/parse': {
        description: 'Parse uploaded BOM or PCB specification file',
        parameters: {
          file: 'File (required) - The file to parse (.xlsx, .xls, .csv, .pdf)',
          forceLLM: 'Boolean (optional) - Force LLM parsing even if algorithmic succeeds'
        },
        response: {
          success: 'Boolean',
          file_name: 'String',
          file_category: '"bom" | "pcb" | "unknown"',
          data: {
            bom: 'ParsedBOM | null',
            pcb: 'ParsedPCBInfo | null',
            inferred_features: 'InferredFeatures | null'
          }
        }
      }
    },
    supported_formats: ['.xlsx', '.xls', '.csv', '.pdf']
  });
}
