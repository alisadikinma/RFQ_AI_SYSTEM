# Phase 6E: Unified RFQ Chat Interface

## 📋 Overview

Phase 6E creates a Gemini-style unified chat interface for RFQ input. Single textarea for everything - paste Excel, upload files, or chat with AI.

**Inspiration**: Google Gemini chat interface (clean, minimal, powerful)

---

## 🎯 Objectives

| Current (Form-based) | Phase 6E (Chat-based) |
|----------------------|----------------------|
| Multiple form fields | Single textarea |
| Separate upload buttons | Unified input area |
| Complex wizard steps | Natural conversation |
| Technical UI | Friendly chat UI |

---

## 🖼️ UI Design

### Main Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏭 New RFQ                                                    [History]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         Hi Ali 👋                                       │
│                   Where should we start?                                │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  Paste station list, upload Excel/PDF, or describe your RFQ...   │  │
│  │                                                                   │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [➕] [📎 Upload]                              [Normal ←→ AI Agent] [➤] │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [📋 Paste Stations]  [📄 Upload Excel]  [📑 Upload PDF]  [✍️ Manual]   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### After Input (Normal Mode)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏭 New RFQ                                                    [History]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📎 XIAOMI_Station_List.xlsx                              [✕]    │   │
│  │ 45 rows detected • Excel table format                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✅ Extracted 28 stations (17 skipped - Status=0)                │   │
│  │                                                                 │   │
│  │ MBT, CAL1, RFT1, RFT2, MMI, VISUAL, OS_DOWNLOAD...             │   │
│  │                                                                 │   │
│  │ [View Details]                      [→ Continue to Comparison]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Add more info or ask questions...                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [➕] [📎 Upload]                              [Normal ←→ AI Agent] [➤] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### AI Agent Mode (Conversation)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏭 New RFQ                                                    [History]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 👤 You                                                          │   │
│  │ Saya mau quote untuk produk IoT sensor temperature,             │   │
│  │ ada WiFi dan BLE, target 50K pcs/month                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🤖 RFQ Assistant                                                │   │
│  │                                                                 │   │
│  │ Berdasarkan deskripsi produk IoT dengan WiFi dan BLE, saya     │   │
│  │ rekomendasikan station berikut:                                 │   │
│  │                                                                 │   │
│  │ ✅ OS_DOWNLOAD - Firmware programming                          │   │
│  │ ✅ CAL - Sensor calibration (temperature)                      │   │
│  │ ✅ RFT - RF test untuk WiFi & BLE                              │   │
│  │ ✅ CURRENT_TESTING - Power consumption check                   │   │
│  │ ✅ VISUAL - Final inspection                                   │   │
│  │                                                                 │   │
│  │ Apakah ada station tambahan yang dibutuhkan?                   │   │
│  │                                                                 │   │
│  │ [Accept Recommendations]  [Modify]  [Add More Info]            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Type your message...                                             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [➕] [📎 Upload]                              [Normal ←→ AI Agent] [➤] │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Two Modes

### Mode 1: Normal (Default)

**Flow:**
```
Input (paste/upload/type) 
    → Auto-detect format
    → Process immediately
    → Show extraction result
    → [Continue] → Comparison Page
```

**Behavior:**
- Paste Excel → Auto-parse dengan Phase 6D library
- Upload file → Process dan extract
- Type station list → Parse dan resolve
- Minimal conversation, langsung ke hasil
- Quick path ke Comparison Page

### Mode 2: AI Agent

**Flow:**
```
Input (describe product/ask question)
    → AI processes and responds
    → Back-and-forth conversation
    → User confirms/modifies
    → [Proceed] → Comparison Page
```

**Behavior:**
- Natural language input
- AI suggests stations based on product description
- Can ask clarifying questions
- Provides explanations
- User controls when to proceed

---

## 🏗️ Architecture

### Component Structure

```
app/
└── (dashboard)/
    └── rfq/
        └── new/
            ├── page.tsx              # Main page (minimal)
            └── components/
                ├── RfqChatInterface.tsx      # Main container
                ├── ChatInput.tsx             # Unified input area
                ├── ModeSwitch.tsx            # Normal ↔ AI Agent toggle
                ├── QuickActions.tsx          # Bottom action buttons
                ├── MessageBubble.tsx         # Chat message display
                ├── FilePreview.tsx           # Uploaded file preview
                ├── ExtractionResult.tsx      # Parsed stations display
                ├── AiRecommendation.tsx      # AI suggested stations
                └── ProcessingIndicator.tsx   # Loading states
```

### State Management

```typescript
interface RfqChatState {
  // Mode
  mode: 'normal' | 'ai_agent';
  
  // Messages (for AI Agent mode)
  messages: ChatMessage[];
  
  // Extracted data
  extractedStations: ExtractedStation[];
  uploadedFiles: UploadedFile[];
  
  // Processing
  isProcessing: boolean;
  processingStep: string | null;
  
  // Ready for next step
  canProceed: boolean;
  
  // Customer context (optional)
  selectedCustomer: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  actions?: MessageAction[];  // Buttons in message
}

interface Attachment {
  type: 'file' | 'extraction' | 'recommendation';
  data: any;
}

interface MessageAction {
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'outline';
}
```

---

## 📝 Component Specifications

### 1. RfqChatInterface.tsx (Main Container)

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatInput } from './ChatInput';
import { ModeSwitch } from './ModeSwitch';
import { QuickActions } from './QuickActions';
import { MessageBubble } from './MessageBubble';
import { FilePreview } from './FilePreview';
import { ExtractionResult } from './ExtractionResult';
import { ProcessingIndicator } from './ProcessingIndicator';

export function RfqChatInterface() {
  const router = useRouter();
  const [state, setState] = useState<RfqChatState>({
    mode: 'normal',
    messages: [],
    extractedStations: [],
    uploadedFiles: [],
    isProcessing: false,
    processingStep: null,
    canProceed: false,
    selectedCustomer: null,
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);
  
  // Handle input submit
  const handleSubmit = async (input: string, files?: File[]) => {
    if (state.mode === 'normal') {
      await processNormalMode(input, files);
    } else {
      await processAiAgentMode(input, files);
    }
  };
  
  // Normal mode: auto-process and show result
  const processNormalMode = async (input: string, files?: File[]) => {
    setState(s => ({ ...s, isProcessing: true, processingStep: 'Detecting format...' }));
    
    try {
      // If files uploaded, process files
      if (files?.length) {
        // Process with Phase 6D parser
        const result = await processFiles(files);
        setState(s => ({
          ...s,
          extractedStations: result.stations,
          uploadedFiles: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
          canProceed: result.stations.length > 0,
        }));
      } 
      // If text input, parse as station list
      else if (input.trim()) {
        const result = await parseInput(input);
        setState(s => ({
          ...s,
          extractedStations: result.stations,
          canProceed: result.stations.length > 0,
        }));
      }
    } finally {
      setState(s => ({ ...s, isProcessing: false, processingStep: null }));
    }
  };
  
  // AI Agent mode: conversational
  const processAiAgentMode = async (input: string, files?: File[]) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: files?.map(f => ({ type: 'file', data: f })),
    };
    
    setState(s => ({
      ...s,
      messages: [...s.messages, userMessage],
      isProcessing: true,
    }));
    
    try {
      // Call AI API
      const response = await callAiAgent(input, files, state.messages);
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        attachments: response.recommendations ? [{
          type: 'recommendation',
          data: response.recommendations,
        }] : undefined,
        actions: response.actions,
      };
      
      setState(s => ({
        ...s,
        messages: [...s.messages, assistantMessage],
        extractedStations: response.stations || s.extractedStations,
        canProceed: (response.stations?.length || s.extractedStations.length) > 0,
      }));
    } finally {
      setState(s => ({ ...s, isProcessing: false }));
    }
  };
  
  // Proceed to comparison page
  const handleProceed = () => {
    // Save state to session/context
    sessionStorage.setItem('rfq_stations', JSON.stringify(state.extractedStations));
    router.push('/rfq/new/comparison');
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">New RFQ</h1>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Welcome Message (if no messages) */}
        {state.messages.length === 0 && state.extractedStations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Hi Ali 👋</p>
            <h2 className="text-2xl font-medium mt-2">Where should we start?</h2>
          </div>
        )}
        
        {/* Messages */}
        {state.messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg}
            onAction={handleMessageAction}
          />
        ))}
        
        {/* Uploaded Files Preview */}
        {state.uploadedFiles.length > 0 && (
          <FilePreview 
            files={state.uploadedFiles}
            onRemove={handleRemoveFile}
          />
        )}
        
        {/* Extraction Result */}
        {state.extractedStations.length > 0 && (
          <ExtractionResult
            stations={state.extractedStations}
            onProceed={handleProceed}
            onModify={() => {/* open editor */}}
          />
        )}
        
        {/* Processing Indicator */}
        {state.isProcessing && (
          <ProcessingIndicator step={state.processingStep} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t px-6 py-4 space-y-3">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={state.isProcessing}
          placeholder={state.mode === 'normal' 
            ? "Paste station list, upload Excel/PDF, or type stations..."
            : "Describe your product or ask questions..."
          }
        />
        
        <div className="flex items-center justify-between">
          <QuickActions onAction={handleQuickAction} />
          <ModeSwitch 
            mode={state.mode} 
            onChange={(m) => setState(s => ({ ...s, mode: m }))}
          />
        </div>
      </div>
    </div>
  );
}
```

### 2. ChatInput.tsx

```tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Paperclip, 
  Plus, 
  Send, 
  X,
  FileSpreadsheet,
  FileText 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInputProps {
  onSubmit: (input: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle paste (Excel data)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    
    // Check if it looks like Excel table (has tabs)
    if (text.includes('\t')) {
      // Let it paste normally, will be processed on submit
    }
    
    // Check for files
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    
    if (pastedFiles.length) {
      setFiles(prev => [...prev, ...pastedFiles]);
    }
  }, []);
  
  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  };
  
  // Handle submit
  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;
    
    onSubmit(input, files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
  };
  
  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-2">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-background rounded border text-sm"
            >
              {file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') ? (
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
              ) : (
                <FileText className="h-4 w-4 text-blue-600" />
              )}
              <span className="max-w-32 truncate">{file.name}</span>
              <button 
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input Area */}
      <div className="relative flex items-end gap-2 p-2 border rounded-2xl bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20">
        {/* Add Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 mr-2" />
              Upload File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Upload Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv,.pdf"
          multiple
          onChange={handleFileChange}
        />
        
        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />
        
        {/* Send Button */}
        <Button 
          size="icon" 
          className="shrink-0 rounded-full"
          onClick={handleSubmit}
          disabled={disabled || (!input.trim() && files.length === 0)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 3. ModeSwitch.tsx

```tsx
'use client';

import { cn } from '@/lib/utils';
import { Bot, Zap } from 'lucide-react';

interface ModeSwitchProps {
  mode: 'normal' | 'ai_agent';
  onChange: (mode: 'normal' | 'ai_agent') => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-full">
      <button
        onClick={() => onChange('normal')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
          mode === 'normal' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Zap className="h-4 w-4" />
        Normal
      </button>
      <button
        onClick={() => onChange('ai_agent')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
          mode === 'ai_agent' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Bot className="h-4 w-4" />
        AI Agent
      </button>
    </div>
  );
}
```

### 4. QuickActions.tsx

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  FileSpreadsheet, 
  FileText, 
  PenLine 
} from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    { id: 'paste', icon: ClipboardList, label: 'Paste Stations' },
    { id: 'excel', icon: FileSpreadsheet, label: 'Upload Excel' },
    { id: 'pdf', icon: FileText, label: 'Upload PDF' },
    { id: 'manual', icon: PenLine, label: 'Manual Entry' },
  ];
  
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={() => onAction(action.id)}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
```

### 5. ExtractionResult.tsx

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight,
  Edit 
} from 'lucide-react';
import { ExtractedStation } from '@/lib/excel-parser/types';

interface ExtractionResultProps {
  stations: ExtractedStation[];
  skipped?: number;
  onProceed: () => void;
  onModify: () => void;
}

export function ExtractionResult({ 
  stations, 
  skipped = 0,
  onProceed, 
  onModify 
}: ExtractionResultProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Group by section if available
  const sections = stations.reduce((acc, s) => {
    const section = s.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(s);
    return acc;
  }, {} as Record<string, ExtractedStation[]>);
  
  return (
    <Card className="mt-4 border-green-200 bg-green-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-medium">
            Extracted {stations.length} stations
          </span>
          {skipped > 0 && (
            <span className="text-sm text-muted-foreground">
              ({skipped} skipped - Status=0)
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        {/* Preview */}
        <div className="flex flex-wrap gap-1.5">
          {stations.slice(0, expanded ? undefined : 10).map((s, i) => (
            <Badge key={i} variant="secondary" className="font-mono">
              {s.name}
            </Badge>
          ))}
          {!expanded && stations.length > 10 && (
            <Badge variant="outline" className="cursor-pointer" onClick={() => setExpanded(true)}>
              +{stations.length - 10} more
            </Badge>
          )}
        </div>
        
        {/* Expanded: Show by section */}
        {expanded && Object.keys(sections).length > 1 && (
          <div className="mt-4 space-y-3">
            {Object.entries(sections).map(([section, items]) => (
              <div key={section}>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {section}
                </p>
                <div className="flex flex-wrap gap-1">
                  {items.map((s, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View details
            </>
          )}
        </button>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" onClick={onModify}>
          <Edit className="h-4 w-4 mr-1" />
          Modify
        </Button>
        <Button size="sm" onClick={onProceed}>
          Continue to Comparison
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 6. MessageBubble.tsx

```tsx
'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { ChatMessage, MessageAction } from './types';

interface MessageBubbleProps {
  message: ChatMessage;
  onAction?: (action: string) => void;
}

export function MessageBubble({ message, onAction }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isUser ? "flex-row-reverse" : ""
    )}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isUser ? "bg-primary" : "bg-muted"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      {/* Content */}
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Name */}
        <span className="text-xs text-muted-foreground mb-1">
          {isUser ? 'You' : 'RFQ Assistant'}
        </span>
        
        {/* Message */}
        <div className={cn(
          "rounded-2xl px-4 py-2",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-sm" 
            : "bg-muted rounded-tl-sm"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        
        {/* Recommendations */}
        {message.attachments?.map((att, i) => (
          att.type === 'recommendation' && (
            <div key={i} className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm font-medium mb-2">Recommended Stations:</p>
              <div className="flex flex-wrap gap-1">
                {att.data.map((s: any, j: number) => (
                  <Badge key={j} variant="secondary">{s.code}</Badge>
                ))}
              </div>
            </div>
          )
        ))}
        
        {/* Actions */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex gap-2 mt-2">
            {message.actions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onAction?.(action.action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🔌 API Endpoints

### 1. Process Input (Normal Mode)

`POST /api/rfq/process-input`

```typescript
// Request
{
  input?: string;        // Text input (pasted data)
  files?: File[];        // Uploaded files
  customerId?: string;   // Optional customer context
}

// Response
{
  type: 'excel_table' | 'station_list' | 'file_upload';
  stations: ExtractedStation[];
  skipped: number;
  warnings?: string[];
}
```

### 2. AI Agent Chat

`POST /api/rfq/chat`

```typescript
// Request
{
  message: string;
  history: ChatMessage[];
  attachments?: File[];
  customerId?: string;
}

// Response
{
  content: string;           // AI response text
  stations?: ExtractedStation[];  // If recommendations made
  actions?: MessageAction[]; // Action buttons
  followUp?: string;        // Suggested follow-up
}
```

---

## 🔗 Integration with Phase 6D

Phase 6E **uses** Phase 6D library for Excel parsing:

```typescript
// In RfqChatInterface.tsx
import { detectInputType } from '@/lib/excel-parser/detector';
import { parseTable, mergeMultiRowHeaders } from '@/lib/excel-parser/table-parser';
import { detectColumns } from '@/lib/excel-parser/column-detector';
import { extractStations } from '@/lib/excel-parser/extractor';

// When user pastes Excel data
const processExcelInput = async (text: string) => {
  const detection = detectInputType(text);
  
  if (detection.type === 'excel_table') {
    let table = parseTable(text);
    table = mergeMultiRowHeaders(table);
    const columns = detectColumns(table);
    
    // Auto-extract if high confidence
    if (columns.confidence > 0.8 && columns.stationNameColumn !== null) {
      return extractStations(table, {
        stationNameColumn: columns.stationNameColumn,
        statusColumn: columns.statusColumn,
        statusFilterValue: '1',
        sectionColumn: columns.sectionColumn,
        skipHeaderRows: 1,
        includeDescription: false,
      });
    }
    
    // Otherwise show Table Preview Modal from 6D
    return { needsPreview: true, table, columns };
  }
  
  return { stations: [] };
};
```

---

## ✅ Acceptance Criteria

| # | Criteria | Priority |
|---|----------|----------|
| 1 | Unified chat-style input interface | P0 |
| 2 | Mode switch: Normal ↔ AI Agent | P0 |
| 3 | Paste Excel auto-detection & processing | P0 |
| 4 | File upload (drag & drop, click) | P0 |
| 5 | Extraction result display | P0 |
| 6 | Continue to Comparison Page | P0 |
| 7 | AI Agent conversation (basic) | P1 |
| 8 | Quick action buttons | P1 |
| 9 | File preview before processing | P1 |
| 10 | Chat history in AI Agent mode | P2 |

---

## 📋 Implementation Checklist

### Phase 6E Tasks

- [ ] **Page & Layout**
  - [ ] Create `app/(dashboard)/rfq/new/page.tsx` (new design)
  - [ ] Responsive layout (mobile-friendly)

- [ ] **Components**
  - [ ] `RfqChatInterface.tsx` (main container)
  - [ ] `ChatInput.tsx` (unified input)
  - [ ] `ModeSwitch.tsx` (toggle)
  - [ ] `QuickActions.tsx` (action buttons)
  - [ ] `MessageBubble.tsx` (chat messages)
  - [ ] `FilePreview.tsx` (uploaded files)
  - [ ] `ExtractionResult.tsx` (parsed stations)
  - [ ] `ProcessingIndicator.tsx` (loading states)

- [ ] **Integration**
  - [ ] Connect Phase 6D Excel parser
  - [ ] Station resolution API
  - [ ] Comparison page navigation

- [ ] **API Endpoints**
  - [ ] `POST /api/rfq/process-input`
  - [ ] `POST /api/rfq/chat` (for AI Agent)

- [ ] **State Management**
  - [ ] Session storage for cross-page data
  - [ ] Chat history persistence

---

## 🔗 Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Phase 6D | Excel parser library | 📝 Spec ready |
| Phase 6A | Station resolution | ✅ Ready |
| Phase 6B | Comparison page | 📝 Spec ready |

---

## 🤖 LLM Agent Integration (NEW)

### File Structure

```
lib/llm/
├── client.ts              ✅ Existing (OpenRouter fallback)
├── gemini-client.ts       🆕 NEW - Primary Gemini API
├── agent.ts               🆕 NEW - RFQ chat agent logic
├── explain.ts             ✅ Existing
├── index.ts               📝 Update exports
└── prompts/
    └── rfq-agent.ts       🆕 NEW - System prompts

app/api/rfq/
└── chat/
    └── route.ts           🆕 NEW - Agent API endpoint
```

### 1. Gemini Client (`lib/llm/gemini-client.ts`)

```typescript
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
}

export async function callGemini(
  messages: GeminiMessage[],
  systemInstruction?: string,
  config: GeminiConfig = {}
): Promise<{ content: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const { model = DEFAULT_MODEL, temperature = 0.7, maxOutputTokens = 4096 } = config;
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: messages,
    generationConfig: { temperature, maxOutputTokens },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '' };
}

export async function callGeminiJSON<T>(
  messages: GeminiMessage[],
  systemInstruction?: string,
  config?: GeminiConfig
): Promise<T> {
  const { content } = await callGemini(messages, systemInstruction, config);
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse JSON');
  }
}
```

### 2. RFQ Agent (`lib/llm/agent.ts`)

```typescript
import { callGemini, callGeminiJSON, GeminiMessage } from './gemini-client';
import { RFQ_AGENT_SYSTEM_PROMPT, STATION_INFERENCE_PROMPT } from './prompts/rfq-agent';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: { stations?: InferredStation[]; actions?: AgentAction[] };
}

export interface InferredStation {
  code: string;
  name: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AgentAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'outline';
}

export async function processAgentMessage(
  userMessage: string,
  history: AgentMessage[] = [],
  context?: { customerId?: string; existingStations?: string[] }
): Promise<{ content: string; stations?: InferredStation[]; actions?: AgentAction[] }> {
  
  const geminiHistory: GeminiMessage[] = history.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  
  geminiHistory.push({ role: 'user', parts: [{ text: userMessage }] });

  const response = await callGemini(geminiHistory, RFQ_AGENT_SYSTEM_PROMPT, { temperature: 0.7 });
  const stations = await inferStationsFromDescription(userMessage);
  
  const actions: AgentAction[] = stations.length > 0 ? [
    { id: 'accept', label: 'Terima Rekomendasi', type: 'primary' },
    { id: 'modify', label: 'Modifikasi', type: 'secondary' },
    { id: 'proceed', label: 'Lanjut ke Comparison', type: 'outline' },
  ] : [];

  return { content: response.content, stations: stations.length > 0 ? stations : undefined, actions };
}

export async function inferStationsFromDescription(description: string): Promise<InferredStation[]> {
  try {
    const prompt = STATION_INFERENCE_PROMPT.replace('{{DESCRIPTION}}', description);
    const result = await callGeminiJSON<{ stations: InferredStation[] }>(
      [{ role: 'user', parts: [{ text: prompt }] }],
      undefined,
      { temperature: 0.3 }
    );
    return result.stations || [];
  } catch {
    return [];
  }
}
```

### 3. System Prompts (`lib/llm/prompts/rfq-agent.ts`)

```typescript
export const RFQ_AGENT_SYSTEM_PROMPT = `Kamu adalah RFQ Assistant, ahli manufaktur EMS.

## Test Stations:
- MBT: Manual Bench Test
- CAL: Calibration (sensor, ADC/DAC)
- RFT: RF Test (WiFi, BLE, 2G/3G/4G/5G)
- MMI: Man-Machine Interface (touchscreen, button, display)
- VISUAL: Inspeksi visual
- OS_DOWNLOAD: Flash firmware
- CURRENT_TESTING: Power consumption
- ICT/FCT/AOI: Standard tests
- UNDERFILL, T_GREASE, SHIELDING_COVER: Assembly

## Aturan Inferensi:
- WiFi/BLE/RF → RFT, CAL
- MCU → OS_DOWNLOAD, MBT
- Sensor → CAL
- Display → MMI
- Battery → CURRENT_TESTING
- BGA → UNDERFILL

Format: ✅ STATION - Alasan | ❓ Pertanyaan | ⚠️ Warning
Bahasa Indonesia, profesional.`;

export const STATION_INFERENCE_PROMPT = `Analisis produk: {{DESCRIPTION}}

JSON response:
{"stations":[{"code":"XXX","name":"Full Name","reason":"Alasan","confidence":"high|medium|low"}]}`;
```

### 4. API Route (`app/api/rfq/chat/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { processAgentMessage, AgentMessage } from '@/lib/llm/agent';

export async function POST(request: NextRequest) {
  try {
    const { message, history, customerId, existingStations } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const agentHistory: AgentMessage[] = (history || []).map((h: any) => ({
      id: h.id || crypto.randomUUID(),
      role: h.role,
      content: h.content,
      timestamp: new Date(h.timestamp),
    }));

    const response = await processAgentMessage(message, agentHistory, { customerId, existingStations });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## 📋 Updated Implementation Checklist

### LLM Agent (Do First) 🆕
- [ ] Create `lib/llm/gemini-client.ts`
- [ ] Create `lib/llm/prompts/rfq-agent.ts`
- [ ] Create `lib/llm/agent.ts`
- [ ] Update `lib/llm/index.ts` exports
- [ ] Create `app/api/rfq/chat/route.ts`
- [ ] Test Gemini API connection

### UI Components (Continue from checkpoint)
- [x] Types file for chat interface
- [x] ModeSwitch component
- [x] ChatInput component
- [ ] QuickActions component
- [ ] MessageBubble component
- [ ] FilePreview component
- [ ] ExtractionResult component
- [ ] ProcessingIndicator component
- [ ] RfqChatInterface main container

### Integration
- [ ] Update rfq/new page
- [ ] Connect Agent API to chat UI
- [ ] Test AI Agent mode
- [ ] Verify build passes

---

## 📊 Page Flow

```
/rfq/new (Phase 6E)
    │
    │ User inputs data
    │
    ├─► Normal Mode
    │   │
    │   └─► Auto-process → Show result → [Continue]
    │                                        │
    │                                        ▼
    │                              /rfq/new/comparison (Phase 6B)
    │
    └─► AI Agent Mode
        │
        └─► Conversation → User confirms → [Proceed]
                                              │
                                              ▼
                                    /rfq/new/comparison (Phase 6B)
```

---

## 🎨 Design Notes

### Gemini-Inspired Elements

1. **Clean minimal interface** - Focus on the input
2. **Rounded corners** - Soft, friendly feel
3. **Chat bubbles** - Conversational UI
4. **Quick actions** - Easy access to common tasks
5. **Progressive disclosure** - Show details on demand

### Color Scheme

- Background: Light gray (`bg-muted/30`)
- Input area: Rounded pill shape
- User messages: Primary color
- Assistant messages: Light gray
- Success states: Green tints
- CTAs: Primary buttons

### Accessibility

- Keyboard navigation (Tab, Enter, Shift+Enter)
- Screen reader labels
- Focus indicators
- Sufficient color contrast
