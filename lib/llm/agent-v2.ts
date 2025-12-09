/**
 * RFQ AI Agent with Function Calling + Vision
 * Using OpenRouter API (OpenAI-compatible format)
 */

import { AGENT_TOOLS, executeTool } from './tools';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return key;
}

/**
 * System prompt for the RFQ AI Agent
 */
const SYSTEM_PROMPT = `You are an expert RFQ (Request for Quotation) assistant for an Electronics Manufacturing Services (EMS) company in Batam, Indonesia.

## Your Capabilities:
1. Extract station lists from images/screenshots
2. Find similar historical models based on stations
3. Search the EMS knowledge base for technical information
4. Provide detailed model comparisons

## Available Tools:
- search_knowledge: Search EMS technical documentation
- find_similar_models: Find historical models matching station list (USE THIS after extracting stations!)
- get_model_details: Get detailed info about a specific model
- get_customer_stations: Get stations used by a customer historically
- get_station_details: Get details about a specific station
- list_available_stations: List all available test stations

## CRITICAL WORKFLOW - Follow this exactly:

### When user uploads an image:
1. Extract ALL station names from the image
2. IMMEDIATELY call find_similar_models with the extracted stations
3. Present top 3-5 matches with similarity scores
4. Ask if user wants to see detailed comparison

### When user provides station list (text):
1. IMMEDIATELY call find_similar_models with those stations
2. Present top 3-5 matches with similarity scores

### Response Format for Similar Models:
Present results in this format:
---
📊 **Analisis Selesai!**

Ditemukan X model serupa berdasarkan Y station yang diekstrak:

**🥇 Model 1: [MODEL_CODE]** - Customer: [CUSTOMER]
   - Similarity: XX%
   - Total Stations: N | Total MP: M
   - ✅ Match: [stations]
   - ❌ Missing: [stations]

**🥈 Model 2: [MODEL_CODE]** - Customer: [CUSTOMER]
   ...

Klik model untuk melihat detail comparison.
---

## Response Guidelines:
1. Always respond in Bahasa Indonesia
2. After extracting stations from image, ALWAYS run find_similar_models immediately
3. Show top 3-5 models with scores > 50%
4. Include similarity percentage, matched/missing stations
5. Be proactive - don't wait for user to ask for analysis

## Important:
- NEVER stop after extracting stations - always continue to find similar models
- Use tools to get REAL data from database
- If no similar models found, suggest similar products or explain why`;

export interface AgentMessage {
  role: 'user' | 'assistant' | 'function' | 'tool';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: unknown;
  };
  tool_call_id?: string;
}

export interface SimilarModel {
  id: string;
  code: string;
  name: string;
  customer: string;
  customer_code: string;
  similarity: number;
  total_stations: number;
  total_manpower: number;
  matched_stations: string[];
  missing_stations: string[];
  extra_stations: string[];
  all_stations: string[];
}

export interface AgentResponse {
  content: string;
  stations?: Array<{
    code: string;
    name: string;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  similarModels?: SimilarModel[];
  toolsUsed?: string[];
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'outline';
  }>;
}

function getOpenAITools() {
  return AGENT_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function toOpenAIFormat(messages: AgentMessage[]) {
  return messages.map(msg => {
    if (msg.role === 'tool' && msg.functionResponse) {
      return {
        role: 'tool' as const,
        tool_call_id: msg.tool_call_id || msg.functionResponse.name,
        content: JSON.stringify(msg.functionResponse.response),
      };
    }
    
    if (msg.functionCall) {
      return {
        role: 'assistant' as const,
        content: null,
        tool_calls: [{
          id: msg.functionCall.name,
          type: 'function' as const,
          function: {
            name: msg.functionCall.name,
            arguments: JSON.stringify(msg.functionCall.args),
          },
        }],
      };
    }
    
    return {
      role: msg.role === 'function' ? 'tool' as const : msg.role as 'user' | 'assistant',
      content: msg.content,
    };
  });
}

async function callOpenRouterWithTools(
  messages: AgentMessage[],
  maxIterations: number = 8
): Promise<{ content: string; toolsUsed: string[]; toolResults: Record<string, any> }> {
  const apiKey = getApiKey();
  
  const toolsUsed: string[] = [];
  const toolResults: Record<string, any> = {};
  let currentMessages = [...messages];
  let iteration = 0;
  
  while (iteration < maxIterations) {
    iteration++;
    
    console.log(`🤖 Agent iteration ${iteration}, messages:`, currentMessages.length);
    
    const requestBody = {
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...toOpenAIFormat(currentMessages),
      ],
      tools: getOpenAITools(),
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4096,
    };
    
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
      console.error('OpenRouter API error:', response.status, error);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }
    
    const data = await response.json();
    const choice = data.choices?.[0];
    
    if (!choice?.message) {
      throw new Error('No response from OpenRouter');
    }
    
    const message = choice.message;
    
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        const { name, arguments: argsStr } = toolCall.function;
        let args = {};
        
        try {
          args = JSON.parse(argsStr || '{}');
        } catch (e) {
          console.error('Failed to parse tool args:', argsStr);
        }
        
        toolsUsed.push(name);
        
        console.log(`🔧 Tool call: ${name}`, JSON.stringify(args).slice(0, 200));
        
        const result = await executeTool(name, args);
        
        // Store tool results for later use
        toolResults[name] = result;
        
        console.log(`📦 Tool result (${name}):`, JSON.stringify(result).slice(0, 500));
        
        currentMessages.push({
          role: 'assistant',
          content: '',
          functionCall: { name, args },
        });
        
        currentMessages.push({
          role: 'tool',
          content: '',
          tool_call_id: toolCall.id || name,
          functionResponse: { name, response: result },
        });
      }
      
      continue;
    }
    
    console.log(`✅ Final response received, tools used:`, toolsUsed);
    
    return {
      content: message.content || 'Maaf, saya tidak bisa memberikan respons.',
      toolsUsed,
      toolResults,
    };
  }
  
  return {
    content: 'Maaf, terlalu banyak iterasi. Silakan coba lagi.',
    toolsUsed,
    toolResults,
  };
}

function extractStationsFromResponse(content: string): AgentResponse['stations'] {
  const stations: AgentResponse['stations'] = [];
  const patterns = [
    /[✅✓•\*\-\d.]\s*\*?\*?([A-Z][A-Z0-9_]{1,25})\*?\*?\s*[-–:]?\s*(.*)/gi,
    /\*\*([A-Z][A-Z0-9_]{1,25})\*\*/gi,
    /^([A-Z][A-Z0-9_]{1,25})$/gm,
  ];
  
  const stationCodes = new Set<string>();
  const knownCodes = [
    'RFT', 'CAL', 'MMI', 'MBT', 'VISUAL', 'OS_DOWNLOAD', 'CURRENT_TESTING',
    'ICT', 'FCT', 'AOI', 'UNDERFILL', 'T_GREASE', 'SHIELDING', 'CAMERA',
    'NFC', 'FINGERPRINT', 'WIRELESS_CHARGING', 'ROUTER', 'DEPANEL',
    'PCB_CURRENT', 'AXI', 'SPI', 'COATING', 'POTTING', 'BURN_IN',
    'SMT', 'REFLOW', 'WAVE', 'SELECTIVE', 'THT', 'PTH', 'ASSEMBLY',
    'PACKING', 'LABELING', 'OQC', 'FQC', 'IQC', 'PROGRAMMING', 'WIFIBT',
    'CAL1', 'CAL2', 'RFT1', 'RFT2', '4G', '5G',
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const code = match[1].toUpperCase();
      const reason = match[2]?.trim() || '';
      
      const isKnown = knownCodes.some(k => code.includes(k) || k.includes(code));
      const isValidCode = /^[A-Z][A-Z0-9_]{1,25}$/.test(code);
      
      if ((isKnown || isValidCode) && !stationCodes.has(code) && code.length <= 25) {
        stationCodes.add(code);
        stations.push({
          code,
          name: code.replace(/_/g, ' '),
          reason: reason.slice(0, 100),
          confidence: isKnown ? 'high' : 'medium',
        });
      }
    }
  }
  
  return stations.length > 0 ? stations : undefined;
}

export async function processAgentMessage(
  userMessage: string,
  history: AgentMessage[] = [],
  context?: {
    customerId?: string;
    existingStations?: string[];
    image?: string;
  }
): Promise<AgentResponse> {
  console.log('🚀 Processing agent message:', userMessage.slice(0, 100));
  
  let userContent: AgentMessage['content'];
  
  if (context?.image) {
    console.log('📷 Image attached, using vision mode');
    userContent = [
      { type: 'text', text: userMessage },
      {
        type: 'image_url',
        image_url: { url: `data:image/png;base64,${context.image}` },
      },
    ];
  } else {
    userContent = userMessage;
  }
  
  const messages: AgentMessage[] = [
    ...history,
    { role: 'user', content: userContent },
  ];
  
  try {
    const { content, toolsUsed, toolResults } = await callOpenRouterWithTools(messages);
    
    console.log('📝 Agent response:', content.slice(0, 200));
    
    // Extract stations from response
    const stations = extractStationsFromResponse(content);
    
    // Extract similar models from tool results
    let similarModels: SimilarModel[] | undefined;
    if (toolResults['find_similar_models']?.success) {
      similarModels = toolResults['find_similar_models'].matches;
    }
    
    // Generate actions
    let actions: AgentResponse['actions'] | undefined;
    
    if (similarModels && similarModels.length > 0) {
      actions = [
        { id: 'select_model', label: 'Pilih Model', type: 'primary' },
        { id: 'compare_all', label: 'Compare All', type: 'secondary' },
        { id: 'export', label: 'Export', type: 'outline' },
      ];
    } else if (stations?.length) {
      actions = [
        { id: 'accept', label: 'Terima Rekomendasi', type: 'primary' },
        { id: 'modify', label: 'Modifikasi', type: 'secondary' },
      ];
    }
    
    return {
      content,
      stations,
      similarModels,
      toolsUsed,
      actions,
    };
  } catch (error) {
    console.error('Agent error:', error);
    
    return {
      content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}. Silakan coba lagi.`,
    };
  }
}

export function isAgentAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
