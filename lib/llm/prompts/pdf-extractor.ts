/**
 * PDF Extractor LLM Prompts
 * Prompts for extracting PCB information from PDF documents using LLM
 */

import { callLLMJSON } from '../client';
import type { LLMParsedPCB } from '@/lib/parsers/types';

const SYSTEM_PROMPT = `You are an expert PCB manufacturing engineer analyzing PCB specification documents.
Your task is to extract dimensional and specification information from raw PDF text.

You must analyze the document and return a JSON object with the following structure:
{
  "length_mm": number | null,
  "width_mm": number | null,
  "layer_count": number | null,
  "cavity_count": number | null,
  "thickness_mm": number | null,
  "notes": string[]
}

Extraction guidelines:
- Dimensions: Look for length/width in mm. Common formats: "100mm x 80mm", "L=100 W=80", "Size: 100x80"
- Length should be the larger dimension, width the smaller
- Layer count: Look for "4-layer", "6L", "layers: 4", etc. Standard values: 1, 2, 4, 6, 8, 10, 12
- Cavity count: Number of PCBs per panel. Look for "4-up", "2x3 array", "panel: 6pcs"
- Thickness: Usually 0.8mm, 1.0mm, 1.2mm, 1.6mm, 2.0mm
- Notes: Extract surface finish (HASL, ENIG, OSP), material (FR4, Rogers), copper weight

Return null for values that cannot be determined from the text.
Be precise and only extract values you are confident about.
Always return valid JSON.`;

/**
 * Extract PCB dimensions and specs using LLM
 */
export async function extractPCBDimensionsWithLLM(rawText: string): Promise<LLMParsedPCB> {
  // Truncate if too long
  const maxLength = 10000;
  const truncatedText = rawText.length > maxLength
    ? rawText.substring(0, maxLength) + '\n... (truncated)'
    : rawText;

  const userPrompt = `Extract PCB specifications from this document:

\`\`\`
${truncatedText}
\`\`\`

Return a JSON object with dimensions (in mm), layer count, cavity count, thickness, and any relevant notes.`;

  const result = await callLLMJSON<LLMParsedPCB>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.1, max_tokens: 1024 }
  );

  // Validate and normalize dimensions
  let length = result.length_mm;
  let width = result.width_mm;

  // Ensure length > width
  if (length !== null && width !== null && width > length) {
    [length, width] = [width, length];
  }

  // Validate reasonable ranges
  if (length !== null && (length < 5 || length > 500)) length = null;
  if (width !== null && (width < 5 || width > 500)) width = null;
  if (result.layer_count !== null && (result.layer_count < 1 || result.layer_count > 20)) {
    result.layer_count = null;
  }
  if (result.cavity_count !== null && (result.cavity_count < 1 || result.cavity_count > 100)) {
    result.cavity_count = null;
  }
  if (result.thickness_mm !== null && (result.thickness_mm < 0.2 || result.thickness_mm > 5)) {
    result.thickness_mm = null;
  }

  return {
    length_mm: length,
    width_mm: width,
    layer_count: result.layer_count || null,
    cavity_count: result.cavity_count || null,
    thickness_mm: result.thickness_mm || null,
    notes: result.notes || [],
  };
}

/**
 * Extract text sections relevant to PCB specs
 */
export async function extractRelevantSections(rawText: string): Promise<string[]> {
  const prompt = `From this document, extract only the sections that contain PCB specifications like:
- Board dimensions
- Layer stackup
- Panel configuration
- Material specifications

Return a JSON array of relevant text excerpts.

Document:
\`\`\`
${rawText.substring(0, 5000)}
\`\`\``;

  const result = await callLLMJSON<{ sections: string[] }>(
    [
      { role: 'system', content: 'You extract relevant text sections from documents. Return JSON with "sections" array.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0, max_tokens: 2048 }
  );

  return result.sections || [];
}
