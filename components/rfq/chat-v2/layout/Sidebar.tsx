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
