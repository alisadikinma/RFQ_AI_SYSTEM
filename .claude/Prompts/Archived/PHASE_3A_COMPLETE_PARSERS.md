# PHASE 3A: Complete File Parsers (Remaining Tasks)

## Context
Phase 3 was partially completed. The following files already exist:
- ✅ lib/parsers/types.ts
- ✅ lib/parsers/excel-parser.ts
- ✅ lib/parsers/bom-analyzer.ts
- ✅ lib/parsers/pdf-parser.ts
- ✅ lib/llm/* (LLM client and prompts)

## Remaining Tasks (4 only)

### Task 1: Create LLM Enhanced Parser
Create `lib/parsers/llm-enhanced.ts`:

```typescript
/**
 * LLM Enhanced Parser
 * Provides LLM fallback for complex or messy files
 * Uses Gemini 2.0 Flash primary, Llama 3.3 fallback
 */

import { callLLM } from '@/lib/llm/client';
import { ParsedStationList, ParsedPCBSpecs, ParseConfidence } from './types';

// Prompt for station list extraction
const STATION_EXTRACTION_PROMPT = `
You are an EMS manufacturing expert. Extract test/assembly stations from this data.

Return JSON only:
{
  "stations": ["STATION_CODE_1", "STATION_CODE_2", ...],
  "board_type": "TOP" | "BOT" | "BOTH" | null,
  "confidence": 0.0-1.0,
  "notes": "any observations"
}

Known station codes: OS_DOWNLOAD, MBT, CAL, RFT, MMI, CURRENT_TESTING, VISUAL, 
UNDERFILL, T_GREASE, SHIELDING_COVER, ICT, FCT, AOI, AXI, ROUTER, PCB_CURRENT,
PACKING, LABEL, BARCODE, WIFI_TEST, BT_TEST, GPS_TEST, NFC_TEST

Map variations: RFT1->RFT, RF_TEST->RFT, Signal_Test->RFT, Thermal_Gress->T_GREASE

Data to parse:
`;

// Prompt for PCB specs extraction
const PCB_EXTRACTION_PROMPT = `
You are a PCB manufacturing expert. Extract PCB specifications from this data.

Return JSON only:
{
  "board_length_mm": number | null,
  "board_width_mm": number | null,
  "layer_count": number | null,
  "cavity_count": number | null,
  "is_double_sided": boolean,
  "confidence": 0.0-1.0,
  "notes": "any observations"
}

Data to parse:
`;

/**
 * Parse station list using LLM
 */
export async function parseStationsWithLLM(
  rawText: string
): Promise<ParsedStationList & ParseConfidence> {
  try {
    const response = await callLLM(
      STATION_EXTRACTION_PROMPT + rawText,
      { temperature: 0.1, maxTokens: 1000 }
    );
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      stations: parsed.stations || [],
      board_type: parsed.board_type || null,
      confidence: parsed.confidence || 0.5,
      parse_method: 'llm',
      warnings: parsed.notes ? [parsed.notes] : []
    };
  } catch (error) {
    console.error('LLM station parsing failed:', error);
    return {
      stations: [],
      board_type: null,
      confidence: 0,
      parse_method: 'llm',
      warnings: [`LLM parsing failed: ${error}`]
    };
  }
}

/**
 * Parse PCB specifications using LLM
 */
export async function parsePCBSpecsWithLLM(
  rawText: string
): Promise<ParsedPCBSpecs & ParseConfidence> {
  try {
    const response = await callLLM(
      PCB_EXTRACTION_PROMPT + rawText,
      { temperature: 0.1, maxTokens: 1000 }
    );
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      board_length_mm: parsed.board_length_mm,
      board_width_mm: parsed.board_width_mm,
      layer_count: parsed.layer_count,
      cavity_count: parsed.cavity_count,
      is_double_sided: parsed.is_double_sided || false,
      confidence: parsed.confidence || 0.5,
      parse_method: 'llm',
      warnings: parsed.notes ? [parsed.notes] : []
    };
  } catch (error) {
    console.error('LLM PCB parsing failed:', error);
    return {
      board_length_mm: null,
      board_width_mm: null,
      layer_count: null,
      cavity_count: null,
      is_double_sided: false,
      confidence: 0,
      parse_method: 'llm',
      warnings: [`LLM parsing failed: ${error}`]
    };
  }
}

/**
 * Generic LLM extraction for unstructured text
 */
export async function extractWithLLM<T>(
  rawText: string,
  extractionPrompt: string
): Promise<T | null> {
  try {
    const response = await callLLM(
      extractionPrompt + rawText,
      { temperature: 0.1, maxTokens: 2000 }
    );
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}
```

---

### Task 2: Create Main Export
Create `lib/parsers/index.ts`:

```typescript
/**
 * File Parsers Module
 * Smart file parsing with automatic LLM fallback
 */

// Types
export * from './types';

// Parsers
export { parseExcelStationList, parseExcelRFQData } from './excel-parser';
export { parsePDFText, extractPCBFromPDF } from './pdf-parser';
export { analyzeBOMFeatures } from './bom-analyzer';

// LLM Enhanced
export { 
  parseStationsWithLLM, 
  parsePCBSpecsWithLLM,
  extractWithLLM 
} from './llm-enhanced';

// Types re-export for convenience
import type { 
  ParsedStationList, 
  ParsedPCBSpecs, 
  ParsedBOMFeatures,
  ParseConfidence 
} from './types';

/**
 * Smart parse with automatic fallback
 * Tries algorithmic first, falls back to LLM if confidence < threshold
 */
import { parseExcelStationList } from './excel-parser';
import { parseStationsWithLLM } from './llm-enhanced';

export async function smartParseStations(
  file: File | Buffer,
  options: { confidenceThreshold?: number } = {}
): Promise<ParsedStationList & ParseConfidence> {
  const threshold = options.confidenceThreshold ?? 0.6;
  
  // Try algorithmic parsing first
  try {
    const result = await parseExcelStationList(file);
    
    if (result.confidence >= threshold) {
      return { ...result, parse_method: 'algorithmic' };
    }
    
    // Confidence too low, try LLM
    console.log(`Algorithmic confidence ${result.confidence} < ${threshold}, trying LLM...`);
  } catch (error) {
    console.log('Algorithmic parsing failed, trying LLM...', error);
  }
  
  // Fallback to LLM
  // Convert file to text for LLM
  let textContent = '';
  if (file instanceof File) {
    textContent = await file.text();
  } else {
    textContent = file.toString('utf-8');
  }
  
  const llmResult = await parseStationsWithLLM(textContent);
  return { ...llmResult, parse_method: 'llm' };
}
```

---

### Task 3: Create API Route
Create `app/api/parse/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { 
  smartParseStations, 
  extractPCBFromPDF,
  parsePCBSpecsWithLLM 
} from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const parseType = formData.get('type') as string || 'auto';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    const fileName = file.name.toLowerCase();
    let result: any;
    
    // Determine parse type
    if (parseType === 'stations' || fileName.includes('station')) {
      // Parse station list
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await smartParseStations(buffer);
      
    } else if (parseType === 'pcb' || fileName.endsWith('.pdf')) {
      // Parse PCB specs from PDF
      const buffer = Buffer.from(await file.arrayBuffer());
      result = await extractPCBFromPDF(buffer);
      
      // If confidence low, try LLM
      if (result.confidence < 0.6) {
        const text = await file.text().catch(() => '');
        if (text) {
          const llmResult = await parsePCBSpecsWithLLM(text);
          if (llmResult.confidence > result.confidence) {
            result = llmResult;
          }
        }
      }
      
    } else {
      // Auto-detect based on file extension
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = Buffer.from(await file.arrayBuffer());
        result = await smartParseStations(buffer);
      } else if (fileName.endsWith('.pdf')) {
        const buffer = Buffer.from(await file.arrayBuffer());
        result = await extractPCBFromPDF(buffer);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Use .xlsx, .xls, or .pdf' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      file_name: file.name,
      file_size: file.size,
      parsed_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

---

### Task 4: Build and Verify
Run these commands:

```bash
npm run build
```

If there are import errors, check:
1. `@/lib/llm/client` exists and exports `callLLM`
2. All type imports match actual exports in `types.ts`
3. No circular dependencies

---

## Expected File Structure After Completion

```
lib/parsers/
├── types.ts           ✅ (exists)
├── excel-parser.ts    ✅ (exists)
├── bom-analyzer.ts    ✅ (exists)
├── pdf-parser.ts      ✅ (exists)
├── llm-enhanced.ts    📝 (create)
└── index.ts           📝 (create)

app/api/parse/
└── route.ts           📝 (create)
```

## Success Criteria
- [ ] `npm run build` completes without errors
- [ ] API route accessible at POST /api/parse
- [ ] LLM fallback works when algorithmic parsing fails
