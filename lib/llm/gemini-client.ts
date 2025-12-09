/**
 * Gemini Client
 * Primary LLM client using Google Gemini API
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GeminiResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Call Gemini API with messages
 */
export async function callGemini(
  messages: GeminiMessage[],
  systemInstruction?: string,
  config: GeminiConfig = {}
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Set GEMINI_API_KEY environment variable.');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxOutputTokens = 4096,
    topP = 0.95,
    topK = 40,
  } = config;

  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: messages,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP,
      topK,
    },
  };

  // Add system instruction if provided
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract content from response
  const candidate = data.candidates?.[0];
  const content = candidate?.content?.parts?.[0]?.text || '';
  const finishReason = candidate?.finishReason;

  return {
    content,
    finishReason,
    usage: data.usageMetadata ? {
      promptTokenCount: data.usageMetadata.promptTokenCount || 0,
      candidatesTokenCount: data.usageMetadata.candidatesTokenCount || 0,
      totalTokenCount: data.usageMetadata.totalTokenCount || 0,
    } : undefined,
  };
}

/**
 * Call Gemini with JSON response parsing
 */
export async function callGeminiJSON<T>(
  messages: GeminiMessage[],
  systemInstruction?: string,
  config?: GeminiConfig
): Promise<T> {
  const response = await callGemini(messages, systemInstruction, config);

  try {
    // Try direct JSON parse
    return JSON.parse(response.content) as T;
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim()) as T;
    }

    // Try to find JSON object in response
    const objectMatch = response.content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]) as T;
    }

    throw new Error('Failed to parse JSON from Gemini response');
  }
}

/**
 * Simple completion helper for Gemini
 */
export async function completeGemini(
  prompt: string,
  systemPrompt?: string,
  config?: GeminiConfig
): Promise<string> {
  const messages: GeminiMessage[] = [
    { role: 'user', parts: [{ text: prompt }] },
  ];

  const response = await callGemini(messages, systemPrompt, config);
  return response.content;
}

/**
 * Convert chat history to Gemini format
 */
export function toGeminiMessages(
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): GeminiMessage[] {
  return history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
