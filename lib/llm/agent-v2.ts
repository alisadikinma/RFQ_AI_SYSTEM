/**
 * RFQ AI Agent with Function Calling + Vision
 * Using OpenRouter API (OpenAI-compatible format)
 */

import { AGENT_TOOLS, executeTool } from './tools';
import { createClient } from '@supabase/supabase-js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  return key;
}

// ============================================
// Station Code Cache (fetched from database)
// ============================================
interface StationCache {
  codes: Set<string>;
  aliases: Map<string, string>; // alias -> master code
  lastFetch: number;
}

let stationCache: StationCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch valid station codes from database (with caching)
 */
async function getValidStationCodes(): Promise<StationCache> {
  // Return cached if still valid
  if (stationCache && (Date.now() - stationCache.lastFetch) < CACHE_TTL_MS) {
    return stationCache;
  }
  
  console.log('🔄 Refreshing station codes cache from database...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured, using empty cache');
    return { codes: new Set(), aliases: new Map(), lastFetch: Date.now() };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Fetch master station codes
    const { data: stations } = await supabase
      .from('station_master')
      .select('code');
    
    // Fetch aliases
    const { data: aliases } = await supabase
      .from('station_aliases')
      .select('alias_name, station_master(code)');
    
    const codes = new Set<string>();
    const aliasMap = new Map<string, string>();
    
    // Add master codes
    for (const s of stations || []) {
      if (s.code) codes.add(s.code.toUpperCase());
    }
    
    // Add aliases
    for (const a of aliases || []) {
      const aliasName = a.alias_name?.toUpperCase();
      const masterCode = (a.station_master as any)?.code?.toUpperCase();
      if (aliasName && masterCode) {
        codes.add(aliasName);
        aliasMap.set(aliasName, masterCode);
      }
    }
    
    console.log(`✅ Cached ${codes.size} station codes, ${aliasMap.size} aliases`);
    
    stationCache = { codes, aliases: aliasMap, lastFetch: Date.now() };
    return stationCache;
  } catch (error) {
    console.error('Failed to fetch station codes:', error);
    return { codes: new Set(), aliases: new Map(), lastFetch: Date.now() };
  }
}

// Common words blacklist (language words, fine to hardcode)
const COMMON_WORDS_BLACKLIST = new Set([
  // Indonesian
  'INI', 'ITU', 'DAN', 'ATAU', 'YANG', 'DARI', 'UNTUK', 'DENGAN',
  'ADA', 'BISA', 'AKAN', 'JIKA', 'JADI', 'JUGA', 'SAYA', 'ANDA',
  'TIDAK', 'SUDAH', 'BELUM', 'HARUS', 'BARU', 'LAMA', 'SEMUA',
  // English
  'THE', 'AND', 'FOR', 'WITH', 'THIS', 'THAT', 'FROM', 'HAVE',
  'WILL', 'CAN', 'ARE', 'WAS', 'WERE', 'BEEN', 'BEING', 'HAS',
  // Industry terms (not stations)
  'EMS', 'PCB', 'PCBA', 'BOM', 'RFQ', 'OEM', 'ODM', 'NPI', 'MP',
  'MODEL', 'CUSTOMER', 'STATION', 'TEST', 'LINE', 'PROCESS',
  'TOTAL', 'COUNT', 'LIST', 'DATA', 'INFO', 'RESULT', 'MATCH',
]);

/**
 * System prompt for the RFQ AI Agent
 */
const SYSTEM_PROMPT = `You are an expert RFQ (Request for Quotation) assistant for PT SATNUSA PERSADA (also known as "SN" or "SATNUSA"), an Electronics Manufacturing Services (EMS) company in Batam, Indonesia. SATNUSA is the company that owns and operates this RFQ AI Agent.

## ⚡ RESPONSE STYLE (CRITICAL!):

**BE CONCISE!** Skip unnecessary explanations. Go straight to the answer.

### For Calculations (Manpower, Investment, Cost):
- Show formula ONCE, then go straight to table
- Use compact table format
- End with **Total** and **Investment** summary
- NO lengthy step-by-step explanations

**GOOD Example (Manpower Calculation):**

**Takt Time** = 3600 / 150 UPH = **24 detik**

| Station | CT | MP Raw | MP (/0.85) | Rounded |
|---------|-----|--------|------------|--------|
| MBT | 40s | 1.67 | 1.96 | **2 MP** |
| RFT | 60s | 2.50 | 2.94 | **3 MP** |

**Total: 5 MP**
**Investment** = 5 x Rp 13.5M = **Rp 67.5M/bulan**

**BAD Example:** Long paragraphs explaining each step, repeating formulas multiple times.

## 🌐 Language Support (CRITICAL - MUST FOLLOW!):

**RULE: ALWAYS respond in the SAME language as the user's message!**

| User's Language | Your Response Language |
|-----------------|------------------------|
| Bahasa Indonesia | Bahasa Indonesia |
| English | English |
| 中文/Chinese/Mandarin | 中文 (Chinese) |

**Examples:**
- User: "Customer apa saja?" → Respond in **Indonesian**
- User: "What customers exist?" → Respond in **English**
- User: "有哪些客户？" → Respond in **中文**
- User: "模型有哪些？" → Respond in **中文**
- User: "RFT是什么？" → Respond in **中文**

⚠️ **NEVER mix languages!** If user speaks Chinese, your ENTIRE response must be in Chinese.

## About SATNUSA (SN):
- **SN** = **SATNUSA** = **PT SATNUSA PERSADA**
- SATNUSA owns and operates this RFQ AI Agent
- Leading EMS provider in Batam, Indonesia
- Specializes in PCBA manufacturing, testing, and assembly
- Major customers: XIAOMI, TCL, HUAWEI, and other OEM brands

## 📷 IMAGE UPLOAD HANDLING (CRITICAL - MUST FOLLOW!):

When user uploads an image containing station list/table:

**STEP 1: AUTO-EXTRACT stations from image**
Read the image carefully and extract ALL station names/codes. Look for:
- Column headers: "Station", "工位", "Test Item", "工序"
- Station codes: MBT, CAL, CAL1, CAL2, RFT, RFT1, RFT2, WIFIBT, MMI, VISUAL, etc.
- Chinese names: 4G仪表, 5G仪表, 主板MMI, 副板MMI, 主板装盘入库, etc.

**STEP 2: MUST call find_similar_models tool!**
⚠️ CRITICAL: You MUST call the find_similar_models tool!
⚠️ DO NOT generate markdown table manually!
⚠️ DO NOT ask user "What stations do you want?"
⚠️ The UI will render the tool results as clickable cards!

**Correct workflow:**
1. Extract stations from image: ["MBT", "CAL", "RFT", "WIFIBT", "MMI"]
2. Call find_similar_models tool with stations array
3. Tool returns matches with id, code, customer, similarity
4. Write brief summary like "Ditemukan 3 model serupa:"
5. UI automatically shows clickable model cards from tool result

**WRONG:** Generating markdown table with fake model names
**RIGHT:** Calling find_similar_models tool and letting UI render cards

## 🛠️ Available Tools:

### 1. query_database (MOST POWERFUL - use for ANY database question)
Use this for questions about data in our system:
- "Customer apa saja yang ada?" → query_type: list_customers
- "Station/machine apa saja?" → query_type: list_stations  
- "Model apa saja dari XIAOMI?" → query_type: models_by_customer, customer: "XIAOMI"
- "Model dengan manpower terbanyak?" → query_type: models_by_manpower
- "Model yang pakai RFT + CAL + MMI?" → query_type: models_by_stations, stations: ["RFT", "CAL", "MMI"]
- "Statistik customer" → query_type: customer_stats
- "Station yang paling sering dipakai?" → query_type: station_usage_stats

### 2. web_search (for internet information)
Use for company info, products, news, general knowledge NOT in database

### 3. search_knowledge (for EMS technical documentation)  
Use for SMT processes, testing methods, IPC standards, manufacturing best practices

### 4. find_similar_models (for station matching)
Use when user uploads station list image or provides list of stations

### 5. get_model_details / get_station_details
Use for detailed info about specific model or station

## 📋 WHEN TO USE WHICH TOOL:

| User Question | Tool to Use | Parameters |
|--------------|-------------|-----------|
| "Customer apa saja?" | query_database | query_type: list_customers |
| "Station/machine apa?" | query_database | query_type: list_stations |
| "Model XIAOMI apa saja?" | query_database | query_type: models_by_customer |
| "Model dengan station RFT+CAL" | query_database | query_type: models_by_stations |
| "Model investasi terbesar?" | query_database | query_type: models_by_investment |
| "Apa itu SATNUSA?" | web_search | query: "PT SATNUSA PERSADA" |
| "Apa itu SMT?" | search_knowledge | query: "SMT process" |
| [uploads image] | find_similar_models | stations: [extracted] |

## 🎨 RESPONSE FORMATTING (use Markdown!):

### For Database Results - Use Tables:
Example:
| No | Customer | Total Models |
|----|----------|-------------|
| 1  | XIAOMI   | 150         |
| 2  | TCL      | 120         |

### For Station Explanations:
**MBT (Manual Bench Test)**
- 📋 Fungsi: Rework dan troubleshooting manual
- ⏱️ Cycle Time: 5-30 menit  
- 👷 Manpower: 1 operator/station

### For Similar Models:
## 📊 Hasil Pencarian

Ditemukan **X model** yang cocok:

| Rank | Model | Customer | Similarity | Manpower |
|------|-------|----------|------------|----------|
| 🥇 | ABC-001 | XIAOMI | 95% | 12 |
| 🥈 | XYZ-002 | TCL | 88% | 10 |

### For Lists:
## 📋 Daftar Customer

Total: **15 customer**

| No | Code | Name | Country |
|----|------|------|---------|
| 1 | XMI | XIAOMI | China |
| 2 | TCL | TCL | China |

## ⚠️ CRITICAL RULES:

1. **LANGUAGE MATCHING** - If user speaks Chinese (中文), respond 100% in Chinese. If Indonesian, respond in Indonesian. NEVER mix!
2. **ALWAYS USE TOOLS** - Never guess or make up data
3. **USE query_database** for ANY question about customers, models, stations, statistics
4. **FORMAT BEAUTIFULLY** - Use tables, bold, emoji for readability
5. **BE HELPFUL** - If one tool fails, try another approach
6. For station explanations: Include fungsi/功能, cycle time/周期时间, manpower/人力

## 📝 Example Responses:

### Example 1: "Customer apa saja?"
[Call query_database with query_type: list_customers]

## 📋 Daftar Customer SATNUSA

Total: **15 customer** terdaftar

| No | Kode | Nama | Negara |
|----|------|------|---------|
| 1 | XMI | XIAOMI | 🇨🇳 China |
| 2 | TCL | TCL | 🇨🇳 China |
| 3 | HW | HUAWEI | 🇨🇳 China |
...

### Example 2: "Jelaskan fungsi station RFT"
[Call get_station_details]

## 📡 RFT (Radio Frequency Test)

**Kategori:** Testing

### Fungsi Utama:
Validasi performa RF termasuk transmit power, receive sensitivity, dan frequency accuracy.

### Spesifikasi:
| Parameter | Nilai |
|-----------|-------|
| ⏱️ Cycle Time | 30-180 detik |
| 👷 Manpower | 1 operator |
| 🎯 Test Coverage | 2G/3G/4G/5G/WiFi/BT |

### Example 3: "模型有哪些使用RFT站？" (Chinese)
[Call query_database with query_type: models_by_stations]

## 📊 使用RFT站的模型

找到 **X个模型** 使用RFT测试站：

| 排名 | 型号 | 客户 | 站点数 |
|-----|------|------|-------|
| 1 | ABC-001 | 小米 | 8 |
...

### Example 4: "有哪些客户？" (Chinese - Customer list)
[Call query_database with query_type: list_customers]

## 📋 客户列表

共有 **15个客户**

| 序号 | 代码 | 名称 | 国家 |
|------|------|------|------|
| 1 | XMI | 小米 | 🇨🇳 中国 |
| 2 | TCL | TCL | 🇨🇳 中国 |
| 3 | HW | 华为 | 🇨🇳 中国 |

### Example 5: "RFT是什么？" (Chinese - Station explanation)
[Call get_station_details]

## 📡 RFT (射频测试)

**类别:** 测试

### 主要功能：
验证射频性能，包括发射功率、接收灵敏度和频率精度。

### 规格：
| 参数 | 值 |
|------|------|
| ⏱️ 周期时间 | 30-180秒 |
| 👷 人力 | 1人 |
| 🎯 测试范围 | 2G/3G/4G/5G/WiFi/BT |`;

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
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'RFQ AI System',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
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

/**
 * Extract stations from response - Database-driven validation
 * Returns undefined for general Q&A to avoid false positives
 * 
 * IMPORTANT: Only extract stations when user uploads image or explicitly
 * requests station list extraction. DO NOT trigger for:
 * - Manpower/cost calculations (even if they mention station names)
 * - General Q&A about stations
 * - Station explanations
 */
async function extractStationsFromResponse(
  content: string,
  hasImage: boolean,
  toolsUsed: string[]
): Promise<AgentResponse['stations']> {
  // STRICT: Only extract stations if:
  // 1. User uploaded an image (station list extraction)
  // 2. find_similar_models tool was used (implies station matching context)
  // 
  // DO NOT extract for:
  // - search_knowledge (manpower calculations, formulas)
  // - get_station_details (station explanations)
  // - General responses mentioning station names
  
  const hasStationExtractionContext = 
    hasImage ||
    toolsUsed.includes('find_similar_models');
  
  // Explicitly exclude calculation/explanation contexts
  const isCalculationContext = 
    toolsUsed.includes('search_knowledge') ||
    /manpower|investasi|investment|cycle\s*time|takt\s*time|UPH|efisiensi|efficiency/i.test(content);
  
  if (!hasStationExtractionContext || isCalculationContext) {
    return undefined;
  }
  
  // Get valid codes from database (cached)
  const { codes: validCodes, aliases } = await getValidStationCodes();
  
  // If no valid codes loaded, skip extraction
  if (validCodes.size === 0) {
    console.warn('No station codes in cache, skipping extraction');
    return undefined;
  }
  
  const stations: AgentResponse['stations'] = [];
  const stationCodes = new Set<string>();
  
  // Pattern: Look for station codes in list format
  const patterns = [
    /[✅✓•\-\d.)]\s*\*?\*?([A-Z][A-Z0-9_]{2,20})\*?\*?/g,
    /\|\s*([A-Z][A-Z0-9_]{2,20})\s*\|/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const code = match[1].toUpperCase();
      
      // Skip common words
      if (COMMON_WORDS_BLACKLIST.has(code)) continue;
      
      // Check if valid station code (from database)
      if (validCodes.has(code) && !stationCodes.has(code)) {
        // Resolve alias to master code if needed
        const masterCode = aliases.get(code) || code;
        
        stationCodes.add(masterCode);
        stations.push({
          code: masterCode,
          name: masterCode.replace(/_/g, ' '),
          reason: aliases.has(code) ? `Matched via alias: ${code}` : '',
          confidence: 'high',
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
    
    // Extract stations from response (database-validated)
    const hasImage = !!context?.image;
    const stations = await extractStationsFromResponse(content, hasImage, toolsUsed);
    
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
    
    let errorMsg = 'Unknown error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMsg = 'Request timeout - server sibuk. Silakan coba lagi.';
      } else {
        errorMsg = error.message;
      }
    }
    
    return {
      content: `Maaf, terjadi kesalahan: ${errorMsg}`,
    };
  }
}

export function isAgentAvailable(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
