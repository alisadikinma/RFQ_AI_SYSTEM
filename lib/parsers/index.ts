/**
 * File Parsers Module
 * Smart file parsing with automatic LLM fallback
 */

import { parseExcelBOM, extractRawTextFromExcel } from './excel-parser';
import { parsePCBPdf, extractRawTextFromPDF } from './pdf-parser';
import { parseExcelBOMWithLLM, parsePCBPdfWithLLM, mergeParseResults, mergePCBResults, shouldUseLLM } from './llm-enhanced';
import { analyzeBOM, inferPCBFeatures, createEmptyBOMSummary } from './bom-analyzer';
import { isLLMAvailable } from '@/lib/llm/client';
import type { FileParseResult, ParsedBOM, ParsedPCBInfo, InferredFeatures } from './types';

// Re-export types and utilities
export * from './types';
export { analyzeBOM, inferPCBFeatures, createEmptyBOMSummary };
export { extractRawTextFromExcel, extractRawTextFromPDF };

// Confidence threshold for triggering LLM fallback
const LLM_CONFIDENCE_THRESHOLD = 0.6;

/**
 * Smart file parser with automatic LLM fallback
 * Parses uploaded files and extracts relevant data
 */
export async function parseUploadedFile(
  file: File,
  options?: { forceLLM?: boolean }
): Promise<FileParseResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name.toLowerCase();

  try {
    // Excel/BOM files (.xlsx, .xls, .csv)
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls') || filename.endsWith('.csv')) {
      return await parseBOMFile(buffer, file.name, options);
    }

    // PDF files (PCB specs)
    if (filename.endsWith('.pdf')) {
      return await parsePDFFile(buffer, file.name, options);
    }

    // Unsupported file type
    return {
      success: false,
      error: `Unsupported file type: ${file.name}. Supported formats: .xlsx, .xls, .csv, .pdf`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to parse ${file.name}: ${errorMessage}`,
    };
  }
}

/**
 * Parse BOM file (Excel/CSV)
 */
async function parseBOMFile(
  buffer: Buffer,
  filename: string,
  options?: { forceLLM?: boolean }
): Promise<FileParseResult> {
  // Try algorithmic parsing first
  let bom: ParsedBOM;

  try {
    bom = await parseExcelBOM(buffer, filename);
  } catch (error: unknown) {
    // If algorithmic fails and LLM is available, try LLM
    if (options?.forceLLM || isLLMAvailable()) {
      try {
        bom = await parseExcelBOMWithLLM(buffer, filename);
        const inferred_features = inferPCBFeatures(bom.summary);
        return { success: true, bom, inferred_features };
      } catch (llmError: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Both algorithmic and LLM parsing failed: ${errorMessage}`,
        };
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to parse BOM: ${errorMessage}`,
    };
  }

  // If low confidence or forced, enhance with LLM
  if (options?.forceLLM || shouldUseLLM(bom.confidence, LLM_CONFIDENCE_THRESHOLD)) {
    try {
      const llmBom = await parseExcelBOMWithLLM(buffer, filename);
      bom = mergeParseResults(bom, llmBom);
    } catch (llmError: unknown) {
      // LLM failed, but we have algorithmic result
      console.warn('LLM enhancement failed, using algorithmic result:', llmError);
    }
  }

  const inferred_features = inferPCBFeatures(bom.summary);
  return { success: true, bom, inferred_features };
}

/**
 * Parse PDF file (PCB specs)
 */
async function parsePDFFile(
  buffer: Buffer,
  filename: string,
  options?: { forceLLM?: boolean }
): Promise<FileParseResult> {
  // Try algorithmic parsing first
  let pcb: ParsedPCBInfo;

  try {
    pcb = await parsePCBPdf(buffer, filename);
  } catch (error: unknown) {
    // If algorithmic fails and LLM is available, try LLM
    if (options?.forceLLM || isLLMAvailable()) {
      try {
        pcb = await parsePCBPdfWithLLM(buffer, filename);
        return { success: true, pcb };
      } catch (llmError: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          success: false,
          error: `Both algorithmic and LLM parsing failed: ${errorMessage}`,
        };
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to parse PDF: ${errorMessage}`,
    };
  }

  // If low confidence or forced, enhance with LLM
  if (options?.forceLLM || shouldUseLLM(pcb.confidence, LLM_CONFIDENCE_THRESHOLD)) {
    try {
      const llmPcb = await parsePCBPdfWithLLM(buffer, filename);
      pcb = mergePCBResults(pcb, llmPcb);
    } catch (llmError: unknown) {
      // LLM failed, but we have algorithmic result
      console.warn('LLM enhancement failed, using algorithmic result:', llmError);
    }
  }

  return { success: true, pcb };
}

/**
 * Force LLM parsing for complex files
 */
export async function parseWithLLM(file: File): Promise<FileParseResult> {
  return parseUploadedFile(file, { forceLLM: true });
}

/**
 * Parse multiple files
 */
export async function parseMultipleFiles(
  files: File[],
  options?: { forceLLM?: boolean }
): Promise<FileParseResult[]> {
  return Promise.all(files.map(file => parseUploadedFile(file, options)));
}

/**
 * Get supported file extensions
 */
export function getSupportedExtensions(): string[] {
  return ['.xlsx', '.xls', '.csv', '.pdf'];
}

/**
 * Check if file type is supported
 */
export function isFileSupported(filename: string): boolean {
  const lower = filename.toLowerCase();
  return getSupportedExtensions().some(ext => lower.endsWith(ext));
}

/**
 * Get file type category
 */
export function getFileCategory(filename: string): 'bom' | 'pcb' | 'unknown' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
    return 'bom';
  }
  if (lower.endsWith('.pdf')) {
    return 'pcb';
  }
  return 'unknown';
}
