# Phase 7A: Layout & Sidebar - Integrated Chat UI

## 🎯 OBJECTIVE
Update existing sidebar untuk menambahkan chat history. Single sidebar dengan nav menu + chat history + settings.

---

## ⚠️ PRE-REQUISITES

1. **Baca PROJECT_STATUS.md** terlebih dahulu
2. **Migration sudah dijalankan** ✅ (chat_sessions & chat_messages tables exist)
3. Install dependencies:
```bash
npm install framer-motion
```

---

## 📋 LAYOUT DESIGN

### Single Sidebar Layout
```
┌──────────────────┬───────────────────────────────────────────────────┐
│  RFQ AI          │                                                   │
│  System          │                                                   │
├──────────────────┤                                                   │
│                  │                                                   │
│  🏠 Dashboard    │                                                   │
│  📊 Machines     │                 CHAT AREA                         │
│  📦 Models       │                (FULL WIDTH)                       │
│                  │                                                   │
│  ──────────────  │                                                   │
│                  │                                                   │
│  + Chat Baru     │      ┌─────────────────────────────────┐         │
│                  │      │      Welcome Screen /           │         │
│  HARI INI        │      │      Message List               │         │
│   └─ Chat 1      │      │      (max-w-3xl centered)       │         │
│   └─ Chat 2      │      └─────────────────────────────────┘         │
│                  │                                                   │
│  KEMARIN         │      ┌─────────────────────────────────┐         │
│   └─ Chat 3      │      │  Input Area              [Send] │         │
│                  │      └─────────────────────────────────┘         │
│  ──────────────  │                                                   │
│  ⚙ Settings      │                                                   │
│  v1.0.0          │                                                   │
└──────────────────┴───────────────────────────────────────────────────┘
```

### Sidebar Sections (Top to Bottom):
1. **Logo & Title** - "RFQ AI System"
2. **Nav Menu** - Dashboard, Machines, Models (existing)
3. **Separator**
4. **+ Chat Baru** - Button to start new chat
5. **Chat History** - Grouped by date (Hari Ini, Kemarin, etc.)
6. **Separator**
7. **Settings & Version** - Bottom fixed

### Key Points:
- ❌ Hapus "New RFQ" dan "RFQ History" menu items (diganti chat)
- ✅ Keep Dashboard, Machines, Models menu
- ✅ Add chat history section below nav menu
- ✅ Chat area full width (right side)
- ✅ Responsive: sidebar collapsible on mobile

---

## 📁 FILE STRUCTURE

```
components/
├── layout/
│   └── Sidebar.tsx              # UPDATE: Add chat history section
│
├── rfq/chat-v2/
│   ├── ChatHistorySection.tsx   # NEW: Chat history for sidebar
│   ├── ChatHistoryItem.tsx      # NEW: Single chat item
│   ├── NewChatButton.tsx        # NEW: "+ Chat Baru" button
│   ├── ChatMain.tsx             # NEW: Main chat container
│   ├── MessageList.tsx          # NEW: Scrollable messages
│   ├── MessageBubble.tsx        # NEW: Single message bubble
│   ├── WelcomeScreen.tsx        # NEW: Initial welcome screen
│   └── index.tsx                # Exports

hooks/
└── useChatHistory.ts            # NEW: Supabase chat persistence

app/
└── (dashboard)/
    └── chat/
        ├── page.tsx             # NEW: Default chat page (welcome)
        └── [id]/page.tsx        # NEW: Specific chat page
```

---

## 📁 FILE IMPLEMENTATIONS

### 1. Update Sidebar.tsx - Add Chat History Section

Find your existing Sidebar component and add the chat history section. The structure should be:

```tsx
// components/layout/Sidebar.tsx (or wherever your sidebar is)
// ADD these imports at top
import { ChatHistorySection } from "@/components/rfq/chat-v2/ChatHistorySection";
import { NewChatButton } from "@/components/rfq/chat-v2/NewChatButton";
import { Separator } from "@/components/ui/separator";

// In your sidebar JSX, add after the nav menu items:
{/* Existing Nav Menu */}
<nav>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/machines">Machines</Link>
  <Link href="/models">Models</Link>
</nav>

<Separator className="my-4" />

{/* NEW: Chat Section */}
<div className="flex-1 flex flex-col min-h-0">
  <NewChatButton />
  <ChatHistorySection />
</div>

<Separator className="my-4" />

{/* Existing Settings & Version */}
<div>
  <Link href="/settings">Settings</Link>
  <span>v1.0.0</span>
</div>
```

### 2. NewChatButton.tsx
```tsx
// components/rfq/chat-v2/NewChatButton.tsx
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function NewChatButton() {
  const router = useRouter();

  const handleNewChat = () => {
    // Navigate to chat page without ID = new chat
    router.push("/chat");
  };

  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-2 mb-4 bg-blue-600 hover:bg-blue-700 text-white border-0"
      onClick={handleNewChat}
    >
      <Plus className="h-4 w-4" />
      Chat Baru
    </Button>
  );
}
```

### 3. ChatHistorySection.tsx
```tsx
// components/rfq/chat-v2/ChatHistorySection.tsx
"use client";

import { useChatHistory } from "@/hooks/useChatHistory";
import { ChatHistoryItem } from "./ChatHistoryItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "next/navigation";

export function ChatHistorySection() {
  const { sessions, isLoading, deleteSession } = useChatHistory();
  const params = useParams();
  const currentChatId = params?.id as string | undefined;

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: Record<string, typeof sessions> = {
      "Hari Ini": [],
      "Kemarin": [],
      "7 Hari Terakhir": [],
      "Lebih Lama": [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.lastMessageAt);
      if (sessionDate.toDateString() === today.toDateString()) {
        groups["Hari Ini"].push(session);
      } else if (sessionDate.toDateString() === yesterday.toDateString()) {
        groups["Kemarin"].push(session);
      } else if (sessionDate > lastWeek) {
        groups["7 Hari Terakhir"].push(session);
      } else {
        groups["Lebih Lama"].push(session);
      }
    });

    return groups;
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-muted-foreground text-center">
        Belum ada chat history
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 pr-2">
        {Object.entries(groupedSessions).map(([group, items]) =>
          items.length > 0 ? (
            <div key={group}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                {group}
              </h3>
              <div className="space-y-1">
                {items.map((session) => (
                  <ChatHistoryItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentChatId}
                    onDelete={() => deleteSession(session.id)}
                  />
                ))}
              </div>
            </div>
          ) : null
        )}
      </div>
    </ScrollArea>
  );
}
```

### 4. ChatHistoryItem.tsx
```tsx
// components/rfq/chat-v2/ChatHistoryItem.tsx
"use client";

import { ChatSession } from "@/hooks/useChatHistory";
import { MessageSquare, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onDelete: () => void;
}

export function ChatHistoryItem({ session, isActive, onDelete }: ChatHistoryItemProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
      )}
      onClick={() => router.push(`/chat/${session.id}`)}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{session.title}</p>
        {session.preview && (
          <p className="text-xs text-muted-foreground truncate">{session.preview}</p>
        )}
      </div>
      
      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### 5. useChatHistory.ts (Supabase Hook)
```tsx
// hooks/useChatHistory.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  files?: { name: string; type: string; size: number; url?: string }[];
  timestamp: Date;
  sequence: number;
  extractedStations?: any[];
  similarModels?: any[];
  costSummary?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  preview?: string;
  status: "active" | "archived" | "deleted";
  messageCount: number;
  stationCount: number;
  modelCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  // Fetch all chat sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("status", "active")
        .order("last_message_at", { ascending: false });

      if (error) throw error;

      setSessions(
        (data || []).map((s) => ({
          id: s.id,
          title: s.title,
          preview: s.preview,
          status: s.status,
          messageCount: s.message_count,
          stationCount: s.station_count,
          modelCount: s.model_count,
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
          lastMessageAt: new Date(s.last_message_at),
        }))
      );
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Get messages for a specific chat
  const getMessages = useCallback(
    async (sessionId: string): Promise<ChatMessage[]> => {
      try {
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("sequence", { ascending: true });

        if (error) throw error;

        return (data || []).map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          files: m.files,
          timestamp: new Date(m.created_at),
          sequence: m.sequence,
          extractedStations: m.extracted_stations,
          similarModels: m.similar_models,
          costSummary: m.cost_summary,
        }));
      } catch (err) {
        console.error("Error fetching messages:", err);
        return [];
      }
    },
    [supabase]
  );

  // Create new chat session
  const createSession = useCallback(
    async (title: string): Promise<string | null> => {
      try {
        const { data, error } = await supabase
          .from("chat_sessions")
          .insert({ title, status: "active" })
          .select("id")
          .single();

        if (error) throw error;
        fetchSessions();
        return data.id;
      } catch (err) {
        console.error("Error creating session:", err);
        return null;
      }
    },
    [supabase, fetchSessions]
  );

  // Add message to chat
  const addMessage = useCallback(
    async (
      sessionId: string,
      message: Omit<ChatMessage, "id" | "timestamp" | "sequence">
    ): Promise<ChatMessage | null> => {
      try {
        const { data: session } = await supabase
          .from("chat_sessions")
          .select("message_count")
          .eq("id", sessionId)
          .single();

        const sequence = (session?.message_count || 0) + 1;

        const { data, error } = await supabase
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            role: message.role,
            content: message.content,
            files: message.files || [],
            extracted_stations: message.extractedStations,
            similar_models: message.similarModels,
            cost_summary: message.costSummary,
            sequence,
          })
          .select()
          .single();

        if (error) throw error;

        return {
          id: data.id,
          role: data.role,
          content: data.content,
          files: data.files,
          timestamp: new Date(data.created_at),
          sequence: data.sequence,
          extractedStations: data.extracted_stations,
          similarModels: data.similar_models,
          costSummary: data.cost_summary,
        };
      } catch (err) {
        console.error("Error adding message:", err);
        return null;
      }
    },
    [supabase]
  );

  // Update session
  const updateSession = useCallback(
    async (sessionId: string, updates: Partial<Pick<ChatSession, "title" | "stationCount" | "modelCount">>) => {
      try {
        const { error } = await supabase
          .from("chat_sessions")
          .update({
            ...(updates.title && { title: updates.title }),
            ...(updates.stationCount !== undefined && { station_count: updates.stationCount }),
            ...(updates.modelCount !== undefined && { model_count: updates.modelCount }),
          })
          .eq("id", sessionId);

        if (error) throw error;
        fetchSessions();
      } catch (err) {
        console.error("Error updating session:", err);
      }
    },
    [supabase, fetchSessions]
  );

  // Delete (soft delete)
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const { error } = await supabase
          .from("chat_sessions")
          .update({ status: "deleted" })
          .eq("id", sessionId);

        if (error) throw error;
        fetchSessions();
      } catch (err) {
        console.error("Error deleting session:", err);
      }
    },
    [supabase, fetchSessions]
  );

  return {
    sessions,
    isLoading,
    error,
    getMessages,
    createSession,
    addMessage,
    updateSession,
    deleteSession,
    refreshSessions: fetchSessions,
  };
}
```

### 6. ChatMain.tsx
```tsx
// components/rfq/chat-v2/ChatMain.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { useRouter } from "next/navigation";

interface ChatMainProps {
  chatId?: string;
}

export function ChatMain({ chatId }: ChatMainProps) {
  const router = useRouter();
  const { getMessages, addMessage, createSession } = useChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when chat changes
  useEffect(() => {
    const loadMessages = async () => {
      if (chatId) {
        setIsLoadingMessages(true);
        const msgs = await getMessages(chatId);
        setMessages(msgs);
        setIsLoadingMessages(false);
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [chatId, getMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    let currentChatId = chatId;
    
    // Create new chat if needed
    if (!currentChatId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      currentChatId = await createSession(title);
      if (!currentChatId) return;
      router.push(`/chat/${currentChatId}`);
    }

    // Optimistic update
    const tempUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      files: files?.map(f => ({ name: f.name, type: f.type, size: f.size })),
      timestamp: new Date(),
      sequence: messages.length + 1,
    };
    setMessages(prev => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      await addMessage(currentChatId, {
        role: "user",
        content,
        files: files?.map(f => ({ name: f.name, type: f.type, size: f.size })),
      });

      // TODO: Call RFQ API in Phase 7B
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantResponse = await addMessage(currentChatId, {
        role: "assistant",
        content: "Ini adalah response placeholder. Implementasi API akan dilakukan di Phase 7B.",
      });
      
      if (assistantResponse) {
        setMessages(prev => [...prev, assistantResponse]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!chatId && messages.length === 0) {
    return <WelcomeScreen onSendMessage={handleSendMessage} />;
  }

  return (
    <MessageList
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      messagesEndRef={messagesEndRef}
    />
  );
}
```

### 7. WelcomeScreen.tsx
```tsx
// components/rfq/chat-v2/WelcomeScreen.tsx
"use client";

import { Upload, FileSpreadsheet, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";

interface WelcomeScreenProps {
  onSendMessage: (content: string, files?: File[]) => void;
}

const suggestions = [
  { icon: Upload, title: "Upload gambar station list", description: "Paste screenshot atau upload foto" },
  { icon: FileSpreadsheet, title: "Upload Excel RFQ", description: "File .xlsx dengan daftar station" },
  { icon: FileText, title: "Upload PDF Spec", description: "Dokumen spesifikasi produk" },
];

export function WelcomeScreen({ onSendMessage }: WelcomeScreenProps) {
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">RFQ AI Assistant</h1>
          <p className="text-muted-foreground">
            Upload gambar, Excel, atau PDF untuk menganalisis station list
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {suggestions.map((s) => (
            <div
              key={s.title}
              className="p-4 rounded-xl border bg-card hover:bg-accent cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <s.icon className="h-8 w-8 text-blue-500 mb-3 mx-auto" />
              <h3 className="font-medium mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan atau paste gambar (Ctrl+V)..."
            className="min-h-[100px] resize-none pr-24"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="absolute bottom-3 right-3"
          >
            Kirim
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.xlsx,.xls,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              onSendMessage("Menganalisis file...", files);
            }
          }}
        />
      </div>
    </div>
  );
}
```

### 8. MessageList.tsx
```tsx
// components/rfq/chat-v2/MessageList.tsx
"use client";

import { ChatMessage } from "@/hooks/useChatHistory";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useState, RefObject } from "react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string, files?: File[]) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export function MessageList({ messages, isLoading, onSendMessage, messagesEndRef }: MessageListProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI sedang memproses...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            placeholder="Ketik pesan..."
            disabled={isLoading}
            className="min-h-[60px] max-h-[200px] resize-none pr-14"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute bottom-2 right-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 9. MessageBubble.tsx
```tsx
// components/rfq/chat-v2/MessageBubble.tsx
"use client";

import { ChatMessage } from "@/hooks/useChatHistory";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-4", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-pink-500"
      )}>
        {isUser ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      <div className={cn(
        "flex-1 max-w-[80%] rounded-2xl px-4 py-3",
        isUser ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
      )}>
        {message.files?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black/10 text-xs">
                📎 {f.name}
              </span>
            ))}
          </div>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={cn("text-xs mt-2", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {new Date(message.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
```

### 10. Index Export
```tsx
// components/rfq/chat-v2/index.tsx
export { ChatHistorySection } from "./ChatHistorySection";
export { ChatHistoryItem } from "./ChatHistoryItem";
export { NewChatButton } from "./NewChatButton";
export { ChatMain } from "./ChatMain";
export { WelcomeScreen } from "./WelcomeScreen";
export { MessageList } from "./MessageList";
export { MessageBubble } from "./MessageBubble";
```

### 11. Chat Page
```tsx
// app/(dashboard)/chat/page.tsx
import { ChatMain } from "@/components/rfq/chat-v2";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatMain />
    </div>
  );
}
```

### 12. Chat with ID Page
```tsx
// app/(dashboard)/chat/[id]/page.tsx
import { ChatMain } from "@/components/rfq/chat-v2";

interface Props {
  params: { id: string };
}

export default function ChatDetailPage({ params }: Props) {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatMain chatId={params.id} />
    </div>
  );
}
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Nav menu tetap ada (Dashboard, Machines, Models)
- [ ] "+ Chat Baru" button di bawah nav menu
- [ ] Chat history grouped by date (Hari Ini, Kemarin, etc.)
- [ ] Chat history dari Supabase (bukan localStorage)
- [ ] Settings & version di bottom sidebar
- [ ] Full width chat area
- [ ] Welcome screen dengan suggestions
- [ ] Message bubbles dengan avatar
- [ ] Auto-scroll ke message terbaru
- [ ] Delete chat berfungsi (soft delete)

---

## 📝 POST-COMPLETION

Update `PROJECT_STATUS.md`:
```
Phase 7A: Layout & Sidebar        ████████████████████ 100% ✅
```
