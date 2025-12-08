/**
 * LLM Client
 * Handles API calls to OpenRouter or compatible LLM APIs
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3-haiku';

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
}

interface LLMResponse {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call LLM API with messages
 */
export async function callLLM(
  messages: LLMMessage[],
  options: LLMCompletionOptions = {}
): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('No LLM API key configured. Set OPENROUTER_API_KEY or OPENAI_API_KEY environment variable.');
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.1,
    max_tokens = 4096,
    json_mode = false,
  } = options;

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens,
  };

  if (json_mode) {
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'RFQ AI System',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  return {
    content,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
      total_tokens: data.usage?.total_tokens || 0,
    },
  };
}

/**
 * Call LLM with JSON response parsing
 */
export async function callLLMJSON<T>(
  messages: LLMMessage[],
  options: LLMCompletionOptions = {}
): Promise<T> {
  const response = await callLLM(messages, { ...options, json_mode: true });

  try {
    // Try to parse as JSON
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

    throw new Error('Failed to parse JSON from LLM response');
  }
}

/**
 * Simple completion helper
 */
export async function complete(
  prompt: string,
  systemPrompt?: string,
  options?: LLMCompletionOptions
): Promise<string> {
  const messages: LLMMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await callLLM(messages, options);
  return response.content;
}

/**
 * Check if LLM is available
 */
export function isLLMAvailable(): boolean {
  return !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}
