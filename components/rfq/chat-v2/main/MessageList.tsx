"use client";

import { ChatMessage, AdditionalProcessData } from "@/hooks/useChatHistory";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInputArea } from "../input/ChatInputArea";
import { Loader2 } from "lucide-react";
import { RefObject } from "react";
import { ExtractedStation } from "../results/ExtractedDataTable";
import { SimilarModel } from "../results/ModelCard";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (content: string, files?: File[]) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  onStationsChange?: (stations: ExtractedStation[]) => void;
  onFindSimilar?: (stations: ExtractedStation[]) => void;
  onSelectModel?: (model: SimilarModel) => void;
  onProcessComplete?: (data: AdditionalProcessData) => void;
}

export function MessageList({
  messages,
  isLoading,
  onSendMessage,
  messagesEndRef,
  onStationsChange,
  onFindSimilar,
  onSelectModel,
  onProcessComplete
}: MessageListProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onStationsChange={onStationsChange}
              onFindSimilar={onFindSimilar}
              onSelectModel={onSelectModel}
              onProcessComplete={onProcessComplete}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI sedang memproses...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area with File Upload Support */}
      <ChatInputArea
        onSendMessage={onSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
}
