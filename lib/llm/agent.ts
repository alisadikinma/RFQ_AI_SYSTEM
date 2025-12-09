/**
 * RFQ Agent
 * AI agent logic for RFQ chat interface
 */

import {
  callGemini,
  callGeminiJSON,
  toGeminiMessages,
  isGeminiAvailable,
  type GeminiMessage,
} from './gemini-client';
import {
  RFQ_AGENT_SYSTEM_PROMPT,
  STATION_INFERENCE_PROMPT,
  QUICK_INFERENCE_MAP,
  STATION_DEFINITIONS,
} from './prompts/rfq-agent';

/**
 * Agent message type
 */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: {
    stations?: InferredStation[];
    actions?: AgentAction[];
    questions?: string[];
    warnings?: string[];
  };
}

/**
 * Inferred station from AI
 */
export interface InferredStation {
  code: string;
  name: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Agent action button
 */
export interface AgentAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'outline';
}

/**
 * Agent response
 */
export interface AgentResponse {
  content: string;
  stations?: InferredStation[];
  actions?: AgentAction[];
  questions?: string[];
  warnings?: string[];
}

/**
 * Process a message in the agent
 */
export async function processAgentMessage(
  userMessage: string,
  history: AgentMessage[] = [],
  context?: {
    customerId?: string;
    existingStations?: string[];
  }
): Promise<AgentResponse> {
  // Check if Gemini is available
  if (!isGeminiAvailable()) {
    // Fallback to quick inference
    return quickInference(userMessage);
  }

  try {
    // Convert history to Gemini format
    const geminiHistory: GeminiMessage[] = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Add current message
    geminiHistory.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    // Call Gemini for conversational response
    const response = await callGemini(
      geminiHistory,
      RFQ_AGENT_SYSTEM_PROMPT,
      { temperature: 0.7 }
    );

    // Also try to infer stations from the user message
    const stations = await inferStationsFromDescription(userMessage);

    // Generate actions based on response
    const actions: AgentAction[] = [];
    if (stations.length > 0) {
      actions.push(
        { id: 'accept', label: 'Terima Rekomendasi', type: 'primary' },
        { id: 'modify', label: 'Modifikasi', type: 'secondary' },
        { id: 'proceed', label: 'Lanjut ke Comparison', type: 'outline' }
      );
    }

    return {
      content: response.content,
      stations: stations.length > 0 ? stations : undefined,
      actions: actions.length > 0 ? actions : undefined,
    };
  } catch (error) {
    console.error('Agent error:', error);
    // Fallback to quick inference on error
    return quickInference(userMessage);
  }
}

/**
 * Infer stations from product description using AI
 */
export async function inferStationsFromDescription(
  description: string
): Promise<InferredStation[]> {
  // First try quick inference for immediate results
  const quickResults = quickInferStations(description);

  // If Gemini is available, enhance with AI
  if (isGeminiAvailable()) {
    try {
      const prompt = STATION_INFERENCE_PROMPT.replace('{{DESCRIPTION}}', description);

      const result = await callGeminiJSON<{
        analysis?: string;
        stations?: Array<{
          code: string;
          name: string;
          reason: string;
          confidence: 'high' | 'medium' | 'low';
        }>;
        questions?: string[];
        warnings?: string[];
      }>(
        [{ role: 'user', parts: [{ text: prompt }] }],
        undefined,
        { temperature: 0.3 }
      );

      if (result.stations && result.stations.length > 0) {
        return result.stations;
      }
    } catch (error) {
      console.error('AI inference error:', error);
    }
  }

  // Return quick inference results
  return quickResults;
}

/**
 * Quick station inference without AI (keyword matching)
 */
export function quickInferStations(description: string): InferredStation[] {
  const lowerDesc = description.toLowerCase();
  const inferredCodes = new Set<string>();
  const reasons: Record<string, string> = {};

  // Check each keyword
  for (const [keyword, stations] of Object.entries(QUICK_INFERENCE_MAP)) {
    if (lowerDesc.includes(keyword)) {
      for (const code of stations) {
        if (!inferredCodes.has(code)) {
          inferredCodes.add(code);
          reasons[code] = `Detected "${keyword}" in description`;
        }
      }
    }
  }

  // Convert to InferredStation array
  return Array.from(inferredCodes).map((code) => {
    const definition = STATION_DEFINITIONS[code];
    return {
      code,
      name: definition?.name || code,
      reason: reasons[code] || `Required for ${definition?.description || 'testing'}`,
      confidence: 'medium' as const,
    };
  });
}

/**
 * Fallback quick inference response
 */
function quickInference(userMessage: string): AgentResponse {
  const stations = quickInferStations(userMessage);

  if (stations.length > 0) {
    const stationList = stations
      .map((s) => `- **${s.code}** (${s.name}): ${s.reason}`)
      .join('\n');

    return {
      content: `Berdasarkan deskripsi produk Anda, saya merekomendasikan station berikut:\n\n${stationList}\n\nApakah ada station tambahan yang diperlukan atau ada yang ingin dimodifikasi?`,
      stations,
      actions: [
        { id: 'accept', label: 'Terima Rekomendasi', type: 'primary' },
        { id: 'modify', label: 'Modifikasi', type: 'secondary' },
        { id: 'proceed', label: 'Lanjut ke Comparison', type: 'outline' },
      ],
    };
  }

  return {
    content: 'Mohon berikan informasi lebih detail tentang produk Anda. Misalnya:\n\n- Jenis konektivitas (WiFi, BLE, 4G/5G, dll)\n- Sensor yang digunakan\n- Fitur display/touchscreen\n- Kebutuhan power/battery\n- Volume produksi\n\nDengan informasi ini, saya dapat merekomendasikan test station yang tepat.',
    questions: [
      'Apa jenis konektivitas yang digunakan?',
      'Apakah ada sensor yang perlu dikalibrasi?',
      'Apakah produk memiliki display atau touchscreen?',
    ],
  };
}

/**
 * Extract confirmed stations from conversation history
 */
export function extractConfirmedStations(
  history: AgentMessage[]
): InferredStation[] {
  const confirmed: InferredStation[] = [];

  for (const msg of history) {
    if (msg.data?.stations) {
      // Check if next message indicates acceptance
      const msgIndex = history.indexOf(msg);
      const nextMsg = history[msgIndex + 1];

      if (nextMsg?.role === 'user') {
        const userResponse = nextMsg.content.toLowerCase();
        if (
          userResponse.includes('terima') ||
          userResponse.includes('ok') ||
          userResponse.includes('setuju') ||
          userResponse.includes('accept') ||
          userResponse.includes('yes')
        ) {
          confirmed.push(...msg.data.stations);
        }
      }
    }
  }

  // Remove duplicates
  const unique = new Map<string, InferredStation>();
  for (const station of confirmed) {
    unique.set(station.code, station);
  }

  return Array.from(unique.values());
}

/**
 * Get station definition by code
 */
export function getStationDefinition(code: string) {
  return STATION_DEFINITIONS[code] || null;
}

/**
 * Get all available stations
 */
export function getAllStations() {
  return Object.entries(STATION_DEFINITIONS).map(([code, def]) => ({
    code,
    ...def,
  }));
}
