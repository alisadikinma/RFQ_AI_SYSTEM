'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Sparkles, Search, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type {
  ChatMessage,
  ChatResponse,
  SuggestedStation,
  ActionButton,
  SimilarModel,
} from '@/lib/rfq/types';

interface AIAssistantChatProps {
  onStationsConfirmed: (stations: string[]) => void;
  onSimilarModelsFound: (models: SimilarModel[], stations: string[]) => void;
  onViewModelDetails?: (modelId: string, stations: string[]) => void;
  initialMessage?: string;
}

export function AIAssistantChat({
  onStationsConfirmed,
  onSimilarModelsFound,
  onViewModelDetails,
  initialMessage,
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load initial welcome message
  useEffect(() => {
    if (!isInitialized) {
      loadWelcomeMessage();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const loadWelcomeMessage = async () => {
    try {
      const response = await fetch('/api/rfq/chat');
      const data: ChatResponse = await response.json();

      if (data.success) {
        const welcomeMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: data.message || '',
          timestamp: new Date(),
          needsClarification: data.needsClarification,
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load welcome message:', error);
      // Fallback welcome message
      setMessages([
        {
          id: generateId(),
          role: 'assistant',
          content: `Halo! Saya AI Assistant untuk membantu kamu menentukan station yang dibutuhkan untuk produk baru.

Ceritakan tentang produk yang akan diproduksi:
• Jenis produk apa? (smartphone, IoT, wearable, dll)
• Fitur-fitur utama?
• Ada requirement khusus?`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/rfq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            suggestedStations: m.suggestedStations,
          })),
        }),
      });

      const data: ChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Chat failed');
      }

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message || '',
        timestamp: new Date(),
        suggestedStations: data.suggestedStations,
        actionButtons: data.actionButtons,
        similarModels: data.similarModels,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal mengirim pesan');

      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages]);

  const handleAction = useCallback(
    async (action: ActionButton) => {
      if (action.action === 'use_stations') {
        const stations = action.data?.stations || [];
        if (stations.length > 0) {
          toast.success(`${stations.length} station dikonfirmasi`);
          onStationsConfirmed(stations);
        }
      } else if (action.action === 'search_models') {
        const stations = action.data?.stations || [];
        if (stations.length === 0) {
          toast.error('Tidak ada station untuk dicari');
          return;
        }

        setIsLoading(true);
        try {
          const response = await fetch('/api/rfq/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                suggestedStations: m.suggestedStations,
              })),
              action: 'search_models',
              stationCodes: stations,
            }),
          });

          const data: ChatResponse = await response.json();

          if (!data.success) {
            throw new Error(data.error || 'Search failed');
          }

          // Add search results to chat
          const resultMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: data.message || '',
            timestamp: new Date(),
            similarModels: data.similarModels,
          };

          setMessages(prev => [...prev, resultMessage]);

          if (data.similarModels && data.similarModels.length > 0) {
            onSimilarModelsFound(data.similarModels, stations);
          }
        } catch (error) {
          console.error('Search error:', error);
          toast.error('Gagal mencari model serupa');
        } finally {
          setIsLoading(false);
        }
      } else if (action.action === 'view_model' && action.data?.modelId) {
        const lastStations = getLastSuggestedStations();
        onViewModelDetails?.(action.data.modelId, lastStations);
      }
    },
    [messages, onStationsConfirmed, onSimilarModelsFound, onViewModelDetails]
  );

  const getLastSuggestedStations = (): string[] => {
    const lastWithStations = [...messages]
      .reverse()
      .find(m => m.suggestedStations && m.suggestedStations.length > 0);
    return lastWithStations?.suggestedStations?.map(s => s.code) || [];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary/10 to-emerald-500/10 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            AI Assistant
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by LLM - Bantu tentukan station requirement
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <ChatBubble
                  message={msg}
                  onAction={handleAction}
                  onViewModel={(modelId) => {
                    const stations = getLastSuggestedStations();
                    onViewModelDetails?.(modelId, stations);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
              <span className="text-sm">AI sedang mengetik...</span>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ketik pesan... (contoh: saya mau bikin smartwatch dengan WiFi)"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Example prompts */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Contoh:</span>
          {[
            'Smartwatch dengan heart rate sensor',
            'HP budget dengan 4G dan LCD',
            'IoT device dengan WiFi',
          ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Chat bubble component
function ChatBubble({
  message,
  onAction,
  onViewModel,
}: {
  message: ChatMessage;
  onAction: (action: ActionButton) => void;
  onViewModel: (modelId: string) => void;
}) {
  const isAI = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isAI ? 'bg-primary text-primary-foreground' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] ${isAI ? '' : 'text-right'}`}>
        <div
          className={`p-3 rounded-2xl ${
            isAI
              ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
              : 'bg-primary text-primary-foreground rounded-tr-sm'
          }`}
        >
          {/* Message text with markdown-like formatting */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ))}
          </div>

          {/* Suggested Stations Table */}
          {message.suggestedStations && message.suggestedStations.length > 0 && (
            <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Rekomendasi Station ({message.suggestedStations.length})
              </h5>
              <div className="space-y-2">
                {message.suggestedStations.map((s) => (
                  <div
                    key={s.code}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Badge variant="secondary" className="font-mono shrink-0">
                      {s.code}
                    </Badge>
                    <span className="text-slate-600 dark:text-slate-400">
                      {s.name} - {s.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Models */}
          {message.similarModels && message.similarModels.length > 0 && (
            <div className="mt-4 space-y-2">
              <h5 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <Search className="w-3 h-3" />
                Model Serupa
              </h5>
              {message.similarModels.map((model, idx) => (
                <div
                  key={model.modelId}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][idx] || '📦'}</span>
                    <span className="font-bold text-primary">{model.similarity}%</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {model.modelCode}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                      - {model.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>📊 {model.stationCount} stations</span>
                    <span>👷 {model.totalManpower} MP</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 p-0 h-auto text-xs"
                    onClick={() => onViewModel(model.modelId)}
                  >
                    Lihat Detail →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {message.actionButtons && message.actionButtons.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actionButtons.map((btn) => (
              <Button
                key={btn.id}
                size="sm"
                variant={btn.variant === 'outline' ? 'outline' : 'default'}
                onClick={() => onAction(btn)}
                className="gap-1"
              >
                {btn.action === 'use_stations' && <CheckCircle2 className="w-3 h-3" />}
                {btn.action === 'search_models' && <Search className="w-3 h-3" />}
                {btn.label}
              </Button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[10px] text-slate-400 mt-1 ${isAI ? '' : 'text-right'}`}>
          {new Date(message.timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

export default AIAssistantChat;
