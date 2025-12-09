# LLM Integration Guide (Simplified)

## 🎯 Overview

Single LLM approach dengan fallback:

```
┌─────────────────────────────────────────────────┐
│              ALL LLM TASKS                      │
│  • BOM Parsing                                  │
│  • PDF Extraction                               │
│  • Result Explanation (Bahasa Indonesia)        │
│  • Suggestions                                  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Gemini 2.0    │ ◄── PRIMARY
              │ Flash         │     (Google AI Studio)
              └───────┬───────┘
                      │
                      │ Rate Limited / Error?
                      ▼
              ┌───────────────┐
              │ Llama 3.3 70B │ ◄── FALLBACK
              │               │     (OpenRouter)
              └───────────────┘
```

---

## ⚙️ Environment Variables

```env
# .env.local

# Primary: Google AI Studio (Gemini)
GEMINI_API_KEY=AIzaSyBCjMPcXXD8gvvGjIQD6d2Nb23HY6_4UOc

# Fallback: OpenRouter (optional, for Llama)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

---

## 📁 File Structure

```
lib/
├── llm/
│   ├── config.ts           # Model configuration
│   ├── gemini-client.ts    # Google AI Studio client
│   ├── openrouter-client.ts # OpenRouter fallback
│   ├── client.ts           # Unified client with fallback
│   ├── prompts/
│   │   ├── bom-parser.ts   # BOM extraction
│   │   ├── pdf-extractor.ts # PCB dimensions
│   │   ├── explainer.ts    # Result explanation (ID)
│   │   └── suggester.ts    # Recommendations
│   └── index.ts
```

---

## 📝 Implementation

### File 1: `lib/llm/config.ts`

```typescript
export const LLM_CONFIG = {
  // Primary: Google AI Studio
  gemini: {
    model: 'gemini-2.0-flash-exp',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    maxTokens: 8192,
    temperature: 0.1,
  },
  
  // Fallback: OpenRouter
  openrouter: {
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 4096,
    temperature: 0.1,
  },
} as const;

export type LLMProvider = 'gemini' | 'openrouter';
```

### File 2: `lib/llm/gemini-client.ts`

```typescript
import { LLM_CONFIG } from './config';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const url = `${LLM_CONFIG.gemini.baseUrl}/models/${LLM_CONFIG.gemini.model}:generateContent?key=${apiKey}`;
  
  const request: GeminiRequest = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
      },
    ],
    generationConfig: {
      temperature: options?.temperature ?? LLM_CONFIG.gemini.temperature,
      maxOutputTokens: options?.maxTokens ?? LLM_CONFIG.gemini.maxTokens,
      ...(options?.jsonMode && { responseMimeType: 'application/json' }),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || '';
}
```

### File 3: `lib/llm/openrouter-client.ts`

```typescript
import { LLM_CONFIG } from './config';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await fetch(`${LLM_CONFIG.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'RFQ AI System',
    },
    body: JSON.stringify({
      model: LLM_CONFIG.openrouter.model,
      messages,
      temperature: options?.temperature ?? LLM_CONFIG.openrouter.temperature,
      max_tokens: options?.maxTokens ?? LLM_CONFIG.openrouter.maxTokens,
      ...(options?.jsonMode && { response_format: { type: 'json_object' } }),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}
```

### File 4: `lib/llm/client.ts` (Unified with Fallback)

```typescript
import { callGemini } from './gemini-client';
import { callOpenRouter } from './openrouter-client';
import type { LLMProvider } from './config';

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  provider?: LLMProvider; // Force specific provider
}

/**
 * Unified LLM client with automatic fallback
 * Primary: Gemini 2.0 Flash
 * Fallback: Llama 3.3 70B (OpenRouter)
 */
export async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  options?: LLMOptions
): Promise<string> {
  // If provider specified, use it directly
  if (options?.provider === 'openrouter') {
    return callOpenRouter(systemPrompt, userPrompt, options);
  }
  
  // Try Gemini first
  try {
    return await callGemini(systemPrompt, userPrompt, options);
  } catch (geminiError: any) {
    console.warn('Gemini failed, trying OpenRouter fallback:', geminiError.message);
    
    // Fallback to OpenRouter
    try {
      return await callOpenRouter(systemPrompt, userPrompt, options);
    } catch (openrouterError: any) {
      // Both failed
      throw new Error(
        `All LLM providers failed. Gemini: ${geminiError.message}, OpenRouter: ${openrouterError.message}`
      );
    }
  }
}

/**
 * Call LLM with retry logic
 */
export async function callLLMWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options?: LLMOptions,
  maxRetries: number = 2
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await callLLM(systemPrompt, userPrompt, options);
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError;
}

/**
 * Parse JSON response from LLM
 */
export function parseJSONResponse<T>(response: string): T {
  try {
    return JSON.parse(response) as T;
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }
    // Try to find raw JSON
    const rawMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (rawMatch) {
      return JSON.parse(rawMatch[0]) as T;
    }
    throw new Error('Failed to parse JSON from LLM response');
  }
}
```

### File 5: `lib/llm/prompts/bom-parser.ts`

```typescript
import { callLLMWithRetry, parseJSONResponse } from '../client';

export interface ParsedBOM {
  total_line_items: number;
  ic_count: number;
  passive_count: number;
  connector_count: number;
  mcu_part_numbers: string[];
  rf_module_parts: string[];
  sensor_parts: string[];
  power_ic_parts: string[];
  inferred_features: {
    has_rf: boolean;
    has_sensors: boolean;
    has_power_stage: boolean;
    has_display_connector: boolean;
    has_battery_connector: boolean;
    estimated_component_count: number;
    has_bga: boolean;
  };
}

const SYSTEM_PROMPT = `You are an EMS (Electronics Manufacturing Services) BOM analyst.
Extract structured data from Bill of Materials content.

COMPONENT IDENTIFICATION:
- MCU: STM32, ESP32, NRF52, PIC, ATmega, ARM Cortex, Snapdragon, MediaTek
- RF: WiFi, Bluetooth, 4G, LTE, 5G, GSM, LoRa, Zigbee, NFC modules
- Sensors: Accelerometer, Gyroscope, Temperature, Pressure, Humidity, IMU
- Power ICs: PMIC, LDO, DC-DC, Buck, Boost, Battery Charger

OUTPUT: Valid JSON only. No markdown, no explanation.`;

const USER_PROMPT = `Analyze this BOM:

{content}

Return JSON:
{
  "total_line_items": number,
  "ic_count": number,
  "passive_count": number,
  "connector_count": number,
  "mcu_part_numbers": ["part1"],
  "rf_module_parts": ["part1"],
  "sensor_parts": ["part1"],
  "power_ic_parts": ["part1"],
  "inferred_features": {
    "has_rf": boolean,
    "has_sensors": boolean,
    "has_power_stage": boolean,
    "has_display_connector": boolean,
    "has_battery_connector": boolean,
    "estimated_component_count": number,
    "has_bga": boolean
  }
}`;

export async function parseBOMWithLLM(bomContent: string): Promise<ParsedBOM> {
  const response = await callLLMWithRetry(
    SYSTEM_PROMPT,
    USER_PROMPT.replace('{content}', bomContent),
    { temperature: 0.1, jsonMode: true }
  );
  
  return parseJSONResponse<ParsedBOM>(response);
}
```

### File 6: `lib/llm/prompts/pdf-extractor.ts`

```typescript
import { callLLMWithRetry, parseJSONResponse } from '../client';

export interface ExtractedPCBDimensions {
  length_mm: number | null;
  width_mm: number | null;
  layer_count: number | null;
  cavity_count: number | null;
  thickness_mm: number | null;
  notes: string[];
}

const SYSTEM_PROMPT = `You are a PCB design document analyst.
Extract dimensional data from PCB drawings/specifications.

LOOK FOR:
- Dimensions: "100mm x 50mm", "L: 100 W: 50"
- Layers: "4-layer", "6L", "Layers: 4"
- Cavity/Array: "2-up", "4 cavity", "2x2 panel"
- Thickness: "1.6mm", "PCB thickness: 1.0mm"

Return null if not found. OUTPUT: JSON only.`;

const USER_PROMPT = `Extract PCB info:

{content}

Return JSON:
{
  "length_mm": number or null,
  "width_mm": number or null,
  "layer_count": number or null,
  "cavity_count": number or null,
  "thickness_mm": number or null,
  "notes": ["observations"]
}`;

export async function extractPCBDimensionsWithLLM(pdfContent: string): Promise<ExtractedPCBDimensions> {
  const response = await callLLMWithRetry(
    SYSTEM_PROMPT,
    USER_PROMPT.replace('{content}', pdfContent),
    { temperature: 0.1, jsonMode: true }
  );
  
  return parseJSONResponse<ExtractedPCBDimensions>(response);
}
```

### File 7: `lib/llm/prompts/explainer.ts`

```typescript
import { callLLMWithRetry, parseJSONResponse } from '../client';

export interface RFQExplanation {
  summary: string;
  similarity_explanation: string;
  station_analysis: string;
  risk_summary: string;
  recommendations: string[];
}

const SYSTEM_PROMPT = `Kamu adalah konsultan manufacturing EMS senior.
Jelaskan hasil analisis RFQ dalam Bahasa Indonesia yang profesional dan mudah dipahami.

GAYA:
- Profesional tapi mudah dipahami
- Gunakan bullet points untuk list
- Berikan konteks kenapa sesuatu penting
- Maksimal 300 kata total`;

const USER_PROMPT = `Jelaskan hasil analisis RFQ:

Model: {model_name}
Customer: {customer_name}

Similarity Match:
- Model Terdekat: {top_match} (Score: {score}%)
- Confidence: {confidence}

Station Analysis:
- Matched: {matched}
- Missing: {missing}
- AI Recommended: {inferred}

Risk Score: {risk_score}/5
Risk Flags: {risk_flags}

Total Investment: ${investment}

Return JSON:
{
  "summary": "Ringkasan 2-3 kalimat",
  "similarity_explanation": "Penjelasan similarity",
  "station_analysis": "Analisis station",
  "risk_summary": "Penjelasan risiko",
  "recommendations": ["Rekomendasi 1", "Rekomendasi 2"]
}`;

export async function explainRFQResult(params: {
  modelName: string;
  customerName: string;
  topMatch: string;
  score: number;
  confidence: string;
  matched: string[];
  missing: string[];
  inferred: string[];
  riskScore: number;
  riskFlags: string[];
  investment: number;
}): Promise<RFQExplanation> {
  const prompt = USER_PROMPT
    .replace('{model_name}', params.modelName)
    .replace('{customer_name}', params.customerName)
    .replace('{top_match}', params.topMatch || 'Tidak ada')
    .replace('{score}', String(Math.round(params.score * 100)))
    .replace('{confidence}', params.confidence)
    .replace('{matched}', params.matched.join(', ') || 'Tidak ada')
    .replace('{missing}', params.missing.join(', ') || 'Tidak ada')
    .replace('{inferred}', params.inferred.join(', ') || 'Tidak ada')
    .replace('{risk_score}', String(params.riskScore))
    .replace('{risk_flags}', params.riskFlags.join(', ') || 'Tidak ada')
    .replace('{investment}', params.investment.toLocaleString());

  const response = await callLLMWithRetry(
    SYSTEM_PROMPT,
    prompt,
    { temperature: 0.3 }
  );
  
  return parseJSONResponse<RFQExplanation>(response);
}
```

### File 8: `lib/llm/prompts/suggester.ts`

```typescript
import { callLLMWithRetry, parseJSONResponse } from '../client';

export interface Suggestion {
  category: 'cost' | 'quality' | 'capacity' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
}

const SYSTEM_PROMPT = `Kamu adalah konsultan EMS manufacturing berpengalaman 20+ tahun.
Berikan saran improvement yang ACTIONABLE dan SPESIFIK.

FOKUS:
1. Cost Optimization - Kurangi biaya
2. Quality - Tingkatkan yield
3. Capacity - Optimasi throughput
4. Risk Mitigation - Kurangi risiko`;

const USER_PROMPT = `Berikan 3-5 saran untuk:

Product: {product_type}
Volume: {volume} units/month
Target UPH: {target_uph}

Stations: {stations}

Issues: {issues}

Costs:
- Labor: ${labor}
- Test: ${test}
- Fixture: ${fixture}

Return JSON array:
[
  {
    "category": "cost|quality|capacity|risk",
    "title": "Short title",
    "description": "Detail",
    "impact": "high|medium|low",
    "action": "Specific action"
  }
]`;

export async function generateSuggestions(params: {
  productType: string;
  volume: number;
  targetUPH: number;
  stations: string[];
  issues: string[];
  costs: { labor: number; test: number; fixture: number };
}): Promise<Suggestion[]> {
  const prompt = USER_PROMPT
    .replace('{product_type}', params.productType)
    .replace('{volume}', String(params.volume))
    .replace('{target_uph}', String(params.targetUPH))
    .replace('{stations}', params.stations.join(', '))
    .replace('{issues}', params.issues.join(', ') || 'None')
    .replace('{labor}', params.costs.labor.toLocaleString())
    .replace('{test}', params.costs.test.toLocaleString())
    .replace('{fixture}', params.costs.fixture.toLocaleString());

  const response = await callLLMWithRetry(
    SYSTEM_PROMPT,
    prompt,
    { temperature: 0.4 }
  );
  
  return parseJSONResponse<Suggestion[]>(response);
}
```

### File 9: `lib/llm/index.ts`

```typescript
// Client
export { callLLM, callLLMWithRetry, parseJSONResponse } from './client';
export { callGemini } from './gemini-client';
export { callOpenRouter } from './openrouter-client';
export { LLM_CONFIG } from './config';

// Prompts
export { parseBOMWithLLM, type ParsedBOM } from './prompts/bom-parser';
export { extractPCBDimensionsWithLLM, type ExtractedPCBDimensions } from './prompts/pdf-extractor';
export { explainRFQResult, type RFQExplanation } from './prompts/explainer';
export { generateSuggestions, type Suggestion } from './prompts/suggester';
```

---

## 🧪 Quick Test

```typescript
// Test Gemini directly
import { callGemini } from '@/lib/llm';

const response = await callGemini(
  'You are a helpful assistant.',
  'Say hello in Indonesian.',
  { temperature: 0.5 }
);
console.log(response); // "Halo!"

// Test with fallback
import { callLLM } from '@/lib/llm';

const response2 = await callLLM(
  'You are a BOM analyst.',
  'Count ICs in: STM32F407, ESP32, BME280',
  { jsonMode: true }
);
```

---

## ⚠️ Rate Limits

| Provider | Model | Free Tier |
|----------|-------|-----------|
| Google AI Studio | Gemini 2.0 Flash | 60 req/min, 1.5M tokens/day |
| OpenRouter | Llama 3.3 70B | 20 req/min, ~2B tokens/day |

---

## 📋 Summary

| Before | After |
|--------|-------|
| 3 models active | 1 primary + 1 fallback |
| OpenRouter for all | Gemini direct + OpenRouter backup |
| Complex routing | Simple try/catch fallback |
