# Phase 7A: Layout & Sidebar - Claude-Style Interface

## 🎯 OBJECTIVE
Buat layout dasar Chat UI seperti Claude dengan sidebar untuk chat history dan main area untuk conversation.

---

## ⚠️ PRE-REQUISITES

1. **Baca PROJECT_STATUS.md** terlebih dahulu

2. **🔴 WAJIB: Create Chat History Tables di Supabase**
   - Buka Supabase SQL Editor
   - Run script: `MIGRATION_CHAT_HISTORY.sql`
   - Verify tables: `chat_sessions` dan `chat_messages`

3. Install dependencies:
```bash
npm install framer-motion
```

---

## 🗄️ DATABASE TABLES (Must exist before starting)

```sql
-- Verify these tables exist:
SELECT COUNT(*) FROM chat_sessions;  -- Should return 0 (empty is OK)
SELECT COUNT(*) FROM chat_messages;  -- Should return 0 (empty is OK)
```

If tables don't exist, run `MIGRATION_CHAT_HISTORY.sql` first!

---

## 📋 TASKS

### Task 1: Create Base Layout Structure

```
components/rfq/chat-v2/
├── layout/
│   ├── ChatLayout.tsx
│   ├── Sidebar.tsx
│   ├── ChatHistoryItem.tsx
│   └── NewChatButton.tsx
├── main/
│   ├── ChatMain.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   └── WelcomeScreen.tsx
└── index.tsx
```

### Task 2: Layout Design Specs

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                 │
│   SIDEBAR      │              MAIN CHAT AREA                    │
│   (280px)      │                                                 │
│   Dark bg      │                                                 │
│                │  ┌─────────────────────────────────────────┐   │
│  [+ New Chat]  │  │                                         │   │
│                │  │         MESSAGE LIST                     │   │
│  ─────────────  │  │         (scrollable)                    │   │
│                │  │                                         │   │
│  Today         │  │  [User message]                         │   │
│  ├─ Chat 1     │  │  [Assistant response]                   │   │
│  ├─ Chat 2     │  │                                         │   │
│                │  └─────────────────────────────────────────┘   │
│  Yesterday     │                                                 │
│  ├─ Chat 3     │  ┌─────────────────────────────────────────┐   │
│                │  │  [Input Area]                      [Send]│   │
│                │  └─────────────────────────────────────────┘   │
│                │                                                 │
└────────────────┴────────────────────────────────────────────────┘
```

---

## 📁 FILE IMPLEMENTATIONS

### 1. ChatLayout.tsx
```tsx
// components/rfq/chat-v2/layout/ChatLayout.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatMain } from "../main/ChatMain";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children?: React.ReactNode;
}

export function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          currentChatId={currentChatId}
          onSelectChat={setCurrentChatId}
          onNewChat={() => setCurrentChatId(null)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatMain chatId={currentChatId} onChatCreated={setCurrentChatId} />
      </main>
    </div>
  );
}
```

### 2. Sidebar.tsx
```tsx
// components/rfq/chat-v2/layout/Sidebar.tsx
"use client";

import { useChatHistory, ChatSession } from "@/hooks/useChatHistory";
import { NewChatButton } from "./NewChatButton";
import { ChatHistoryItem } from "./ChatHistoryItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

interface SidebarProps {
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onClose: () => void;
}

export function Sidebar({ currentChatId, onSelectChat, onNewChat, onClose }: SidebarProps) {
  const { sessions, isLoading, deleteSession } = useChatHistory();

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups: Record<string, ChatSession[]> = {
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

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-white">RFQ AI</h2>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-zinc-400 hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <NewChatButton onClick={onNewChat} />
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          Object.entries(groupedSessions).map(([group, items]) =>
            items.length > 0 ? (
              <div key={group} className="mb-4">
                <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {items.map((session) => (
                    <ChatHistoryItem
                      key={session.id}
                      chat={session}
                      isActive={session.id === currentChatId}
                      onClick={() => onSelectChat(session.id)}
                      onDelete={() => deleteSession(session.id)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500 text-center">
          Powered by AI Agent
        </p>
      </div>
    </div>
  );
}
```

### 3. ChatHistoryItem.tsx
```tsx
// components/rfq/chat-v2/layout/ChatHistoryItem.tsx
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
import { motion } from "framer-motion";

interface ChatHistoryItemProps {
  chat: ChatSession;  // Using ChatSession type but prop named 'chat' for simplicity
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ChatHistoryItem({ chat, isActive, onClick, onDelete }: ChatHistoryItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
        isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
      )}
      onClick={onClick}
    >
      <MessageSquare className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{chat.title}</p>
        {chat.preview && (
          <p className="text-xs text-zinc-500 truncate">{chat.preview}</p>
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
            className="text-red-500 focus:text-red-500"
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
    </motion.div>
  );
}
```

### 4. NewChatButton.tsx
```tsx
// components/rfq/chat-v2/layout/NewChatButton.tsx
"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface NewChatButtonProps {
  onClick: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-white"
        onClick={onClick}
      >
        <Plus className="h-4 w-4" />
        Chat Baru
      </Button>
    </motion.div>
  );
}
```

### 5. ChatMain.tsx
```tsx
// components/rfq/chat-v2/main/ChatMain.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";

interface ChatMainProps {
  chatId: string | null;
  onChatCreated: (id: string) => void;
}

export function ChatMain({ chatId, onChatCreated }: ChatMainProps) {
  const { getMessages, addMessage, createSession, updateSession } = useChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when chat changes (async)
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string, files?: File[]) => {
    let currentChatId = chatId;
    
    // Create new chat if needed (async)
    if (!currentChatId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      currentChatId = await createSession(title);
      if (!currentChatId) {
        console.error("Failed to create session");
        return;
      }
      onChatCreated(currentChatId);
    }

    // Optimistic UI update - show message immediately
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
      // Save user message to database
      await addMessage(currentChatId, {
        role: "user",
        content,
        files: files?.map(f => ({ name: f.name, type: f.type, size: f.size })),
      });

      // TODO: Call RFQ API in Phase 7B
      // For now, mock response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assistantResponse = await addMessage(currentChatId, {
        role: "assistant",
        content: "Ini adalah response placeholder. Implementasi API akan dilakukan di Phase 7B.",
      });
      
      if (assistantResponse) {
        setMessages(prev => [...prev, assistantResponse]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show welcome screen if no messages
  if (messages.length === 0 && !isLoading) {
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

### 6. WelcomeScreen.tsx
```tsx
// components/rfq/chat-v2/main/WelcomeScreen.tsx
"use client";

import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, Image, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef } from "react";

interface WelcomeScreenProps {
  onSendMessage: (content: string, files?: File[]) => void;
}

const suggestions = [
  {
    icon: Upload,
    title: "Upload gambar station list",
    description: "Paste screenshot atau upload foto",
  },
  {
    icon: FileSpreadsheet,
    title: "Upload Excel RFQ",
    description: "File .xlsx dengan daftar station",
  },
  {
    icon: FileText,
    title: "Upload PDF Spec",
    description: "Dokumen spesifikasi produk",
  },
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Logo & Title */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RFQ AI Assistant</h1>
          <p className="text-zinc-400">
            Upload gambar, Excel, atau PDF untuk menganalisis station list dan mencari model serupa
          </p>
        </motion.div>

        {/* Suggestion Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <suggestion.icon className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
              <h3 className="font-medium text-white mb-1">{suggestion.title}</h3>
              <p className="text-sm text-zinc-500">{suggestion.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="relative"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan atau paste gambar (Ctrl+V)..."
            className="min-h-[100px] resize-none bg-zinc-900 border-zinc-700 focus:border-blue-500 text-white placeholder:text-zinc-500 pr-24"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700"
          >
            Kirim
          </Button>
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.xlsx,.xls,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              onSendMessage("Menganalisis file yang diupload...", files);
            }
          }}
        />
      </motion.div>
    </div>
  );
}
```

### 7. MessageList.tsx
```tsx
// components/rfq/chat-v2/main/MessageList.tsx
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI sedang memproses...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan atau paste gambar (Ctrl+V)..."
            disabled={isLoading}
            className="min-h-[60px] max-h-[200px] resize-none bg-zinc-900 border-zinc-700 focus:border-blue-500 text-white placeholder:text-zinc-500 pr-14"
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 8. MessageBubble.tsx
```tsx
// components/rfq/chat-v2/main/MessageBubble.tsx
"use client";

import { ChatMessage } from "@/hooks/useChatHistory";
import { User, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-4", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600" : "bg-gradient-to-br from-purple-500 to-pink-500"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex-1 max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white ml-auto"
            : "bg-zinc-800 text-zinc-100"
        )}
      >
        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.files.map((file, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-black/20 text-xs"
              >
                📎 {file.name}
              </span>
            ))}
          </div>
        )}
        
        {/* Text content */}
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Timestamp */}
        <p
          className={cn(
            "text-xs mt-2",
            isUser ? "text-blue-200" : "text-zinc-500"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
```

### 9. useChatHistory.ts (Hook dengan Supabase)
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
  // For results display (Phase 7C)
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
          .insert({
            title,
            status: "active",
          })
          .select("id")
          .single();

        if (error) throw error;

        // Refresh sessions list
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
        // Get current message count for sequence
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

        // Note: Trigger in DB auto-updates session.message_count & last_message_at
        
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

  // Update session metadata (title, station_count, model_count)
  const updateSession = useCallback(
    async (
      sessionId: string,
      updates: Partial<Pick<ChatSession, "title" | "stationCount" | "modelCount">>
    ) => {
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

  // Delete (soft delete) chat session
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

  // For backward compatibility with existing code
  const chats = sessions;
  const createChat = createSession;
  const deleteChat = deleteSession;

  return {
    // New API
    sessions,
    isLoading,
    error,
    getMessages,
    createSession,
    addMessage,
    updateSession,
    deleteSession,
    refreshSessions: fetchSessions,
    
    // Backward compatible API
    chats,
    createChat,
    deleteChat,
  };
}
```

### 10. useLocalStorage.ts (Hook)
```tsx
// hooks/useLocalStorage.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Return a wrapped version of useState's setter function
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}
```

### 11. Index Export
```tsx
// components/rfq/chat-v2/index.tsx
export { ChatLayout } from "./layout/ChatLayout";
export { Sidebar } from "./layout/Sidebar";
export { ChatMain } from "./main/ChatMain";
export { WelcomeScreen } from "./main/WelcomeScreen";
export { MessageList } from "./main/MessageList";
export { MessageBubble } from "./main/MessageBubble";
```

---

## 🔄 UPDATE PAGE

### Update app/rfq/new/page.tsx
```tsx
// app/rfq/new/page.tsx
import { ChatLayout } from "@/components/rfq/chat-v2";

export default function NewRFQPage() {
  return <ChatLayout />;
}
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] **Database**: chat_sessions & chat_messages tables created in Supabase
- [ ] Layout 2-kolom (sidebar + main) responsive
- [ ] Sidebar menampilkan chat history grouped by date (dari Supabase)
- [ ] Loading state saat fetch sessions
- [ ] New Chat button berfungsi (creates session in DB)
- [ ] Chat history tersimpan di Supabase (BUKAN localStorage)
- [ ] Delete chat berfungsi (soft delete)
- [ ] Welcome screen dengan suggestion cards
- [ ] Message bubbles dengan avatar
- [ ] Auto-scroll ke message terbaru
- [ ] Mobile: sidebar collapsible
- [ ] Animasi smooth dengan Framer Motion

---

## 📝 POST-COMPLETION

**WAJIB UPDATE** `PROJECT_STATUS.md`:

```markdown
### [YYYY-MM-DD] Phase 7A Complete
- Database: chat_sessions & chat_messages tables created
- ChatLayout dengan sidebar responsive
- Chat history dengan Supabase persistence
- Welcome screen dengan suggestion cards
- Message list dengan bubbles
- Files created: 
  - components/rfq/chat-v2/layout/*.tsx
  - components/rfq/chat-v2/main/*.tsx
  - hooks/useChatHistory.ts (Supabase version)
```

Update progress bar:
```
Phase 7A: Layout & Sidebar        ████████████████████ 100% ✅
```

---

**NEXT**: Lanjut ke Phase 7B untuk File Upload & Processing Animation
