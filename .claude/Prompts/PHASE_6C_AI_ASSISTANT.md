# PHASE_6C: AI Assistant Chatbot

## 🎯 Objective
Build AI Assistant chatbot sebagai opsi ke-4 untuk input RFQ:
- User bisa ngobrol natural tentang produk mereka
- AI punya full knowledge tentang platform (stations, models, customers)
- AI membantu user yang bingung menentukan requirement
- Setelah conversation selesai → AI extract stations → Find similar models

**Prerequisite**: Phase 6A & 6B completed

---

## 🤖 AI Assistant Concept

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI ASSISTANT                                     │
│              "Your Intelligent RFQ Consultant"                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CAPABILITIES:                                                           │
│  ─────────────                                                           │
│  • Understand product descriptions in natural language                  │
│  • Infer required stations from product features                        │
│  • Ask clarifying questions to refine requirements                      │
│  • Suggest stations based on product type                               │
│  • Search similar models after requirements are clear                   │
│  • Explain why certain stations are needed                              │
│  • Answer questions about stations, costs, processes                    │
│                                                                          │
│  KNOWLEDGE BASE:                                                         │
│  ───────────────                                                         │
│  • 38 standard stations (code, name, description, triggers)             │
│  • 784 historical models                                                │
│  • 15 customers                                                          │
│  • Station inference rules (product feature → station)                  │
│  • EMS manufacturing process knowledge                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 💬 Conversation Flow

### Example Conversation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 AI Assistant                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 Halo! Saya AI Assistant untuk membantu kamu menentukan       │    │
│  │    station yang dibutuhkan untuk produk baru.                   │    │
│  │                                                                  │    │
│  │    Ceritakan tentang produk yang akan diproduksi:               │    │
│  │    • Jenis produk apa? (smartphone, IoT, wearable, dll)         │    │
│  │    • Fitur-fitur utama?                                         │    │
│  │    • Ada requirement khusus?                                    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 👤 Saya mau bikin HP baru, ada WiFi, Bluetooth, 4G LTE,         │    │
│  │    layar touchscreen 6 inch, dan ada firmware yang harus        │    │
│  │    di-flash                                                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 Baik! Berdasarkan deskripsi produk kamu, saya identifikasi:  │    │
│  │                                                                  │    │
│  │    📶 WiFi + Bluetooth + 4G LTE                                 │    │
│  │       → Perlu **RFT** (Radio Frequency Test)                    │    │
│  │       → Perlu **CAL** (Calibration untuk RF)                    │    │
│  │                                                                  │    │
│  │    📱 Touchscreen 6 inch                                        │    │
│  │       → Perlu **MMI** (Man-Machine Interface Test)              │    │
│  │                                                                  │    │
│  │    💾 Firmware flash                                            │    │
│  │       → Perlu **OS_DOWNLOAD**                                   │    │
│  │                                                                  │    │
│  │    Beberapa pertanyaan untuk melengkapi:                        │    │
│  │    1. Apakah ada komponen **BGA** di PCB?                       │    │
│  │    2. Apakah produk **battery-powered**?                        │    │
│  │    3. Ada **sensor** apa saja? (accelerometer, proximity, dll)  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 👤 Ya ada BGA untuk processor, pakai baterai Li-ion,            │    │
│  │    ada sensor accelerometer dan proximity                        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 Perfect! Saya update rekomendasi station:                    │    │
│  │                                                                  │    │
│  │    ┌──────────────┬────────────────────────────────────────┐    │    │
│  │    │ Station      │ Alasan                                 │    │    │
│  │    ├──────────────┼────────────────────────────────────────┤    │    │
│  │    │ ✅ MBT       │ Manual Bench Test (standar)            │    │    │
│  │    │ ✅ CAL       │ Kalibrasi RF + sensor                  │    │    │
│  │    │ ✅ RFT       │ Test WiFi/Bluetooth/4G                 │    │    │
│  │    │ ✅ MMI       │ Test touchscreen                       │    │    │
│  │    │ ✅ OS_DOWNLOAD│ Flash firmware                        │    │    │
│  │    │ ✅ CURRENT   │ Test konsumsi daya (battery)           │    │    │
│  │    │ ✅ UNDERFILL │ Underfill untuk BGA processor          │    │    │
│  │    │ ✅ VISUAL    │ Inspeksi visual                        │    │    │
│  │    └──────────────┴────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │    **Total: 8 stations**                                        │    │
│  │                                                                  │    │
│  │    Ada yang perlu ditambah atau dikurangi?                      │    │
│  │                                                                  │    │
│  │    ┌────────────────────────┐  ┌────────────────────────────┐   │    │
│  │    │ ✅ Gunakan Rekomendasi │  │ 🔍 Cari Model Serupa      │   │    │
│  │    └────────────────────────┘  └────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│  [Type your message...]                                    [Send ➤]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### After User Clicks "Cari Model Serupa"

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 🤖 Saya cari model dengan station serupa...                     │    │
│  │                                                                  │    │
│  │    🔍 Searching dengan 8 stations:                              │    │
│  │    MBT, CAL, RFT, MMI, OS_DOWNLOAD, CURRENT, UNDERFILL, VISUAL  │    │
│  │                                                                  │    │
│  │    ════════════════════════════════════════════════════════     │    │
│  │                                                                  │    │
│  │    🏆 Ditemukan 3 model serupa!                                 │    │
│  │                                                                  │    │
│  │    ┌─────────────────────────────────────────────────────┐      │    │
│  │    │ 🥇 92% Match                                         │      │    │
│  │    │ **POCO-X6-PRO** - XIAOMI                            │      │    │
│  │    │ 📊 12 stations │ 👷 15 MP                            │      │    │
│  │    │ ✅ Semua station kamu ada di model ini              │      │    │
│  │    │                          [Lihat Detail →]            │      │    │
│  │    └─────────────────────────────────────────────────────┘      │    │
│  │                                                                  │    │
│  │    ┌─────────────────────────────────────────────────────┐      │    │
│  │    │ 🥈 87% Match                                         │      │    │
│  │    │ **REDMI-NOTE-13** - XIAOMI                          │      │    │
│  │    │ 📊 10 stations │ 👷 12 MP                            │      │    │
│  │    │                          [Lihat Detail →]            │      │    │
│  │    └─────────────────────────────────────────────────────┘      │    │
│  │                                                                  │    │
│  │    ┌─────────────────────────────────────────────────────┐      │    │
│  │    │ 🥉 81% Match                                         │      │    │
│  │    │ **TCL-50-SE** - TCL                                  │      │    │
│  │    │ 📊 9 stations │ 👷 11 MP                             │      │    │
│  │    │                          [Lihat Detail →]            │      │    │
│  │    └─────────────────────────────────────────────────────┘      │    │
│  │                                                                  │    │
│  │    Model **POCO-X6-PRO** sangat cocok karena cover semua        │    │
│  │    station yang kamu butuhkan, plus ada beberapa station        │    │
│  │    tambahan yang mungkin berguna.                               │    │
│  │                                                                  │    │
│  │    Mau saya jelaskan detail salah satu model?                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 AI System Prompt

```typescript
const AI_ASSISTANT_SYSTEM_PROMPT = `You are an AI Assistant for an EMS (Electronics Manufacturing Services) RFQ system.
Your role is to help users determine what test stations they need for their new products.

## YOUR KNOWLEDGE

### Available Test Stations (38 total)
${STATION_MASTER_LIST}

### Station Inference Rules
- WiFi/Bluetooth/4G/5G/RF → RFT (Radio Frequency Test), CAL (Calibration)
- Touchscreen/Display/Buttons → MMI (Man-Machine Interface)
- Firmware/Software → OS_DOWNLOAD
- Battery-powered → CURRENT (Current Testing)
- BGA components → UNDERFILL, consider AXI
- Sensors (accelerometer, gyro, proximity) → CAL (Calibration)
- High power dissipation (>5W) → T_GREASE (Thermal Grease)
- Visual quality critical → VISUAL
- All products → MBT (Manual Bench Test) as baseline

### Product Type Templates
- Smartphone: MBT, CAL, RFT, MMI, OS_DOWNLOAD, CURRENT, VISUAL, UNDERFILL
- IoT Device: MBT, CAL, RFT, OS_DOWNLOAD, CURRENT
- Wearable: MBT, CAL, RFT, MMI, OS_DOWNLOAD, CURRENT
- Power Bank: MBT, CURRENT, VISUAL
- Router/Modem: MBT, CAL, RFT, OS_DOWNLOAD

## YOUR BEHAVIOR

1. **Be conversational** - Chat naturally in Bahasa Indonesia
2. **Ask clarifying questions** - Don't assume, ask about BGA, battery, sensors, etc.
3. **Explain your reasoning** - Tell user WHY each station is needed
4. **Be helpful** - If user is confused, guide them step by step
5. **Summarize clearly** - Present final station list in a table
6. **Offer to search** - When requirements are clear, offer to find similar models

## RESPONSE FORMAT

When suggesting stations, use this format:
- List each station with emoji and reason
- Present final list in a table
- Always ask if user wants to add/remove anything
- Offer action buttons: "Gunakan Rekomendasi" and "Cari Model Serupa"

## TOOLS AVAILABLE

You can call these functions:
1. search_similar_models(stations: string[]) - Find similar historical models
2. get_station_info(code: string) - Get detailed info about a station
3. get_model_detail(modelId: string) - Get full model details

When user confirms stations or asks to search, call search_similar_models.
`;
```

---

## 🖥️ UI Design

### Tab Interface (4 Options)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📊 Station List Input                                                   │
│  ┌────────────┬────────────┬─────────────────┬─────────────────────┐    │
│  │ 📄 Excel   │ 📑 PDF     │ ✏️ Manual/Paste │ 🤖 AI Assistant    │    │
│  └────────────┴────────────┴─────────────────┴─────────────────────┘    │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  [Content changes based on selected tab]                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Assistant Tab Content

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 AI ASSISTANT                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                                                                  │    │
│  │  [Chat messages appear here - scrollable]                       │    │
│  │                                                                  │    │
│  │  Height: ~400px                                                 │    │
│  │  Auto-scroll to bottom on new message                           │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  [Type your message...]                              [Send ➤]   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  💡 Contoh pertanyaan:                                                   │
│  • "Saya mau bikin smartwatch dengan heart rate sensor"                 │
│  • "Produk IoT dengan WiFi dan sensor suhu"                             │
│  • "HP budget dengan 4G dan layar LCD"                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### Task 1: Types
**File: `lib/rfq/types.ts`** (extend)

```typescript
// Chat message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Optional structured data from AI
  suggestedStations?: SuggestedStation[];
  similarModels?: SimilarModel[];
  actionButtons?: ActionButton[];
}

export interface SuggestedStation {
  code: string;
  name: string;
  reason: string;
}

export interface ActionButton {
  id: string;
  label: string;
  action: 'use_stations' | 'search_models' | 'view_model';
  data?: any;
}

// AI Assistant state
export interface AIAssistantState {
  messages: ChatMessage[];
  extractedStations: string[];
  isProcessing: boolean;
  conversationComplete: boolean;
}
```

### Task 2: AI Chat API
**File: `app/api/rfq/chat/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/llm/client';
import { findSimilarModels } from '@/lib/rfq/similarity-engine';

export async function POST(request: NextRequest) {
  try {
    const { messages, action } = await request.json();
    
    // Build context with station knowledge
    const systemPrompt = buildSystemPrompt();
    
    // If action is search_models, do similarity search
    if (action === 'search_models') {
      const stations = extractStationsFromConversation(messages);
      const similar = await findSimilarModels(stations, 3, 70);
      return NextResponse.json({
        success: true,
        type: 'search_results',
        stations,
        similarModels: similar
      });
    }
    
    // Generate AI response
    const response = await generateText(
      messages,
      systemPrompt,
      { temperature: 0.7 }
    );
    
    // Parse response for structured data
    const parsed = parseAIResponse(response);
    
    return NextResponse.json({
      success: true,
      type: 'message',
      message: parsed.content,
      suggestedStations: parsed.stations,
      actionButtons: parsed.actions
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

function buildSystemPrompt(): string {
  // Load station master data
  const stations = getStationMasterList(); // From DB or cache
  
  return AI_ASSISTANT_SYSTEM_PROMPT.replace(
    '${STATION_MASTER_LIST}',
    stations.map(s => `- ${s.code}: ${s.name} - ${s.description}`).join('\n')
  );
}

function extractStationsFromConversation(messages: any[]): string[] {
  // Find last AI message with suggested stations
  const lastAIMessage = [...messages]
    .reverse()
    .find(m => m.role === 'assistant' && m.suggestedStations);
  
  if (lastAIMessage?.suggestedStations) {
    return lastAIMessage.suggestedStations.map((s: any) => s.code);
  }
  
  // Fallback: extract from text using regex
  // Look for station codes in the conversation
  return [];
}
```

### Task 3: Chat Component
**File: `components/rfq/AIAssistantChat.tsx`**

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AIAssistantChatProps {
  onStationsConfirmed: (stations: string[]) => void;
  onSimilarModelsFound: (models: SimilarModel[]) => void;
}

export function AIAssistantChat({ 
  onStationsConfirmed,
  onSimilarModelsFound 
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Halo! Saya AI Assistant untuk membantu kamu menentukan station yang dibutuhkan untuk produk baru.

Ceritakan tentang produk yang akan diproduksi:
• Jenis produk apa? (smartphone, IoT, wearable, dll)
• Fitur-fitur utama?
• Ada requirement khusus?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/rfq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });
      
      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestedStations: data.suggestedStations,
        actionButtons: data.actionButtons
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAction = async (action: ActionButton) => {
    if (action.action === 'use_stations') {
      onStationsConfirmed(action.data.stations);
    } else if (action.action === 'search_models') {
      setIsLoading(true);
      try {
        const response = await fetch('/api/rfq/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages,
            action: 'search_models'
          })
        });
        
        const data = await response.json();
        
        // Add search results to chat
        const resultMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔍 Mencari model dengan ${data.stations.length} stations...\n\n` +
            (data.similarModels.length > 0 
              ? `🏆 Ditemukan ${data.similarModels.length} model serupa!`
              : '❌ Tidak ada model dengan kemiripan ≥70%'),
          timestamp: new Date(),
          similarModels: data.similarModels
        };
        
        setMessages(prev => [...prev, resultMessage]);
        
        if (data.similarModels.length > 0) {
          onSimilarModelsFound(data.similarModels);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="flex flex-col h-[500px] border rounded-lg">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <ChatBubble 
              key={msg.id} 
              message={msg} 
              onAction={handleAction}
            />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI sedang mengetik...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      {/* Input */}
      <div className="p-4 border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {/* Example prompts */}
        <div className="mt-2 text-xs text-muted-foreground">
          💡 Contoh: "Saya mau bikin smartwatch dengan heart rate sensor"
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message, onAction }: { 
  message: ChatMessage; 
  onAction: (action: ActionButton) => void;
}) {
  const isAI = message.role === 'assistant';
  
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center
        ${isAI ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      
      <div className={`max-w-[80%] ${isAI ? '' : 'text-right'}`}>
        <div className={`p-3 rounded-lg ${
          isAI ? 'bg-muted' : 'bg-primary text-primary-foreground'
        }`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
          
          {/* Suggested Stations Table */}
          {message.suggestedStations && (
            <div className="mt-3 bg-background rounded p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Station</th>
                    <th className="text-left py-1">Alasan</th>
                  </tr>
                </thead>
                <tbody>
                  {message.suggestedStations.map(s => (
                    <tr key={s.code} className="border-b last:border-0">
                      <td className="py-1 font-medium">✅ {s.code}</td>
                      <td className="py-1 text-muted-foreground">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Similar Models */}
          {message.similarModels && message.similarModels.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.similarModels.map((model, idx) => (
                <div key={model.modelId} className="bg-background rounded p-2">
                  <div className="flex items-center gap-2">
                    <span>{['🥇', '🥈', '🥉'][idx]}</span>
                    <span className="font-bold">{model.similarity}%</span>
                    <span className="font-medium">{model.modelCode}</span>
                    <span className="text-muted-foreground">- {model.customerName}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    📊 {model.stationCount} stations │ 👷 {model.totalManpower} MP
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        {message.actionButtons && (
          <div className="flex gap-2 mt-2">
            {message.actionButtons.map(btn => (
              <Button 
                key={btn.id}
                size="sm"
                variant={btn.action === 'use_stations' ? 'default' : 'outline'}
                onClick={() => onAction(btn)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 4: Integrate to RFQ Form
**File: `app/(dashboard)/rfq/new/page.tsx`** (update)

Add 4th tab for AI Assistant:

```tsx
<Tabs defaultValue="manual">
  <TabsList>
    <TabsTrigger value="excel">📄 Excel</TabsTrigger>
    <TabsTrigger value="pdf">📑 PDF</TabsTrigger>
    <TabsTrigger value="manual">✏️ Manual</TabsTrigger>
    <TabsTrigger value="ai">🤖 AI Assistant</TabsTrigger>
  </TabsList>
  
  {/* ... other tabs ... */}
  
  <TabsContent value="ai">
    <AIAssistantChat
      onStationsConfirmed={(stations) => {
        setResolvedStations(stations.map(code => ({
          input: code,
          resolvedCode: code,
          confidence: 'high',
          matchMethod: 'ai_assistant'
        })));
        // Proceed to similarity search
      }}
      onSimilarModelsFound={(models) => {
        // Navigate to results or show inline
        setSimilarModels(models);
      }}
    />
  </TabsContent>
</Tabs>
```

---

## 📁 File Structure

```
lib/rfq/
└── types.ts                  # Extended with chat types

app/api/rfq/
└── chat/
    └── route.ts              # AI chat endpoint

components/rfq/
└── AIAssistantChat.tsx       # Chat component

lib/llm/prompts/
└── ai-assistant.ts           # System prompt for AI
```

---

## ✅ Acceptance Criteria

### Conversation
- [ ] Welcome message appears on load
- [ ] User can type and send messages
- [ ] AI responds in Bahasa Indonesia
- [ ] AI asks clarifying questions
- [ ] Auto-scroll to latest message

### Station Inference
- [ ] AI correctly infers stations from product description
- [ ] AI explains WHY each station is needed
- [ ] AI presents stations in table format
- [ ] User can confirm or modify suggestions

### Integration
- [ ] "Gunakan Rekomendasi" extracts stations for Phase 6B
- [ ] "Cari Model Serupa" triggers similarity search
- [ ] Similar models appear in chat
- [ ] Click "Lihat Detail" navigates to model detail page

### Knowledge
- [ ] AI knows all 38 stations
- [ ] AI knows inference rules (WiFi → RFT, etc.)
- [ ] AI can answer questions about stations
- [ ] AI responds appropriately to unclear inputs

---

## 🔗 Dependencies

- **Phase 6A**: For station resolution types
- **Phase 6B**: For similarity search function
- **LLM Client**: Gemini 2.0 Flash for chat
