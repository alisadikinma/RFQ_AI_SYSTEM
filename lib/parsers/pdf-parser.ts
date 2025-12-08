/**
 * PDF Parser
 * Extracts PCB dimensions and specifications from PDF documents
 */

import type { ParsedPCBInfo, PCBDimensions } from './types';

// Dynamic import for pdf-parse (server-side only)
let pdfParse: typeof import('pdf-parse') | null = null;

async function getPdfParser() {
  if (!pdfParse) {
    pdfParse = (await import('pdf-parse')).default;
  }
  return pdfParse;
}

/**
 * Parse a PDF file to extract PCB information
 */
export async function parsePCBPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedPCBInfo> {
  const pdf = await getPdfParser();
  const data = await pdf(buffer);
  const text = data.text;

  const dimensions = extractDimensions(text);
  const layers = extractLayerCount(text);
  const cavity = extractCavityCount(text);
  const thickness = extractThickness(text);
  const notes = extractNotes(text);

  // Calculate confidence based on extracted data
  let confidence = 0.3;
  if (dimensions.length_mm && dimensions.width_mm) confidence += 0.3;
  if (layers) confidence += 0.15;
  if (cavity) confidence += 0.15;
  if (thickness) confidence += 0.1;

  return {
    filename,
    dimensions: {
      length_mm: dimensions.length_mm,
      width_mm: dimensions.width_mm,
      layer_count: layers,
      cavity_count: cavity,
      thickness_mm: thickness,
    },
    extracted_text: text,
    parse_method: 'algorithmic',
    confidence,
    notes,
  };
}

/**
 * Extract PCB dimensions from text
 */
function extractDimensions(text: string): { length_mm: number | null; width_mm: number | null } {
  // Pattern: NNNmm x NNNmm or NNN x NNN mm
  const pattern1 = /(\d+\.?\d*)\s*(?:mm)?\s*[x×X]\s*(\d+\.?\d*)\s*mm/gi;
  const matches1 = Array.from(text.matchAll(pattern1));

  for (const match of matches1) {
    const val1 = parseFloat(match[1]);
    const val2 = parseFloat(match[2]);
    // Reasonable PCB size (5mm to 500mm)
    if (val1 >= 5 && val1 <= 500 && val2 >= 5 && val2 <= 500) {
      return {
        length_mm: Math.max(val1, val2),
        width_mm: Math.min(val1, val2),
      };
    }
  }

  // Pattern: Length: NNN mm, Width: NNN mm
  const lengthPattern = /(?:length|L|long)\s*[:=]?\s*(\d+\.?\d*)\s*mm/i;
  const widthPattern = /(?:width|W|wide)\s*[:=]?\s*(\d+\.?\d*)\s*mm/i;
  const lengthMatch = text.match(lengthPattern);
  const widthMatch = text.match(widthPattern);

  if (lengthMatch && widthMatch) {
    const length = parseFloat(lengthMatch[1]);
    const width = parseFloat(widthMatch[1]);
    if (length >= 5 && length <= 500 && width >= 5 && width <= 500) {
      return { length_mm: length, width_mm: width };
    }
  }

  // Pattern: Dimension or Size: NNN x NNN
  const dimPattern = /(?:dimension|size|pcb size)\s*[:=]?\s*(\d+\.?\d*)\s*[x×X]\s*(\d+\.?\d*)/i;
  const dimMatch = text.match(dimPattern);
  if (dimMatch) {
    const val1 = parseFloat(dimMatch[1]);
    const val2 = parseFloat(dimMatch[2]);
    if (val1 >= 5 && val1 <= 500 && val2 >= 5 && val2 <= 500) {
      return {
        length_mm: Math.max(val1, val2),
        width_mm: Math.min(val1, val2),
      };
    }
  }

  return { length_mm: null, width_mm: null };
}

/**
 * Extract layer count from text
 */
function extractLayerCount(text: string): number | null {
  // Pattern: N-layer, N layer, N layers
  const patterns = [
    /(\d+)\s*[-]?\s*layer/i,
    /layer\s*[:=]?\s*(\d+)/i,
    /(\d+)\s*L\s*(?:board|pcb)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const layers = parseInt(match[1]);
      // Reasonable layer count (1 to 20)
      if (layers >= 1 && layers <= 20) {
        return layers;
      }
    }
  }

  return null;
}

/**
 * Extract cavity count (panelization)
 */
function extractCavityCount(text: string): number | null {
  // Pattern: N-up, N up, NxM panel
  const pattern1 = /(\d+)\s*[-]?\s*up/i;
  const match1 = text.match(pattern1);
  if (match1) {
    const count = parseInt(match1[1]);
    if (count >= 1 && count <= 100) return count;
  }

  // Pattern: panel NxM or NxM array
  const pattern2 = /(?:panel|array)\s*[:=]?\s*(\d+)\s*[x×X]\s*(\d+)/i;
  const match2 = text.match(pattern2);
  if (match2) {
    const count = parseInt(match2[1]) * parseInt(match2[2]);
    if (count >= 1 && count <= 100) return count;
  }

  // Pattern: NxM up
  const pattern3 = /(\d+)\s*[x×X]\s*(\d+)\s*(?:up|array)/i;
  const match3 = text.match(pattern3);
  if (match3) {
    const count = parseInt(match3[1]) * parseInt(match3[2]);
    if (count >= 1 && count <= 100) return count;
  }

  return null;
}

/**
 * Extract board thickness from text
 */
function extractThickness(text: string): number | null {
  // Pattern: thickness: N.Nmm, N.N mm thick
  const patterns = [
    /thickness\s*[:=]?\s*(\d+\.?\d*)\s*mm/i,
    /(\d+\.?\d*)\s*mm\s*thick/i,
    /board\s*thickness\s*[:=]?\s*(\d+\.?\d*)/i,
    /pcb\s*thickness\s*[:=]?\s*(\d+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const thickness = parseFloat(match[1]);
      // Reasonable thickness (0.2mm to 5mm)
      if (thickness >= 0.2 && thickness <= 5) {
        return thickness;
      }
    }
  }

  return null;
}

/**
 * Extract relevant notes from text
 */
function extractNotes(text: string): string[] {
  const notes: string[] = [];

  // Check for surface finish
  const finishPatterns = [
    /(?:surface finish|finish)\s*[:=]?\s*(HASL|ENIG|OSP|Immersion\s+\w+|Lead.?Free)/i,
  ];
  for (const pattern of finishPatterns) {
    const match = text.match(pattern);
    if (match) {
      notes.push(`Surface finish: ${match[1]}`);
      break;
    }
  }

  // Check for material
  const materialPatterns = [
    /(?:material|base material)\s*[:=]?\s*(FR-?4|FR4|Rogers|Aluminum|Metal Core|CEM)/i,
  ];
  for (const pattern of materialPatterns) {
    const match = text.match(pattern);
    if (match) {
      notes.push(`Material: ${match[1]}`);
      break;
    }
  }

  // Check for copper weight
  const copperPatterns = [
    /(?:copper|cu)\s*[:=]?\s*(\d+\s*oz|\d+\/\d+\s*oz)/i,
  ];
  for (const pattern of copperPatterns) {
    const match = text.match(pattern);
    if (match) {
      notes.push(`Copper: ${match[1]}`);
      break;
    }
  }

  return notes;
}

/**
 * Extract raw text from PDF for LLM fallback
 */
export async function extractRawTextFromPDF(buffer: Buffer): Promise<string> {
  const pdf = await getPdfParser();
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(buffer: Buffer): Promise<{
  pages: number;
  info: Record<string, unknown>;
}> {
  const pdf = await getPdfParser();
  const data = await pdf(buffer);
  return {
    pages: data.numpages,
    info: data.info || {},
  };
}

/**
 * Create empty PCB dimensions object
 */
export function createEmptyPCBDimensions(): PCBDimensions {
  return {
    length_mm: null,
    width_mm: null,
    layer_count: null,
    cavity_count: null,
    thickness_mm: null,
  };
}
