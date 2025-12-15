"use client";

import { useChatHistory, ChatSession } from "@/hooks/useChatHistory";
import { ChatHistoryItem } from "./ChatHistoryItem";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500 dark:text-slate-400" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400 text-center">
        Belum ada chat history
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto pr-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
      <div className="space-y-4">
        {Object.entries(groupedSessions).map(([group, items]) =>
          items.length > 0 ? (
            <div key={group}>
              <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
                {group}
              </h3>
              <div className="space-y-1 px-2">
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
    </div>
  );
}
