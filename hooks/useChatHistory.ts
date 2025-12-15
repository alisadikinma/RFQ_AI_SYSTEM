"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ExtractedStation } from "@/components/rfq/chat-v2/results/ExtractedDataTable";
import { SimilarModel } from "@/components/rfq/chat-v2/results/ModelCard";

export interface CostSummary {
  totalManpower: number;
  estimatedUph: number;
  estimatedCycleTime: number;
  confidence: number;
}

export interface AdditionalProcessData {
  selections: Record<string, boolean | string>;
  totalManpower: number;
  totalInvestment: number;
  monthlyLaborCost: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  files?: { name: string; type: string; size: number; url?: string }[];
  timestamp: Date;
  sequence: number;
  // For results display (Phase 7C)
  extractedStations?: ExtractedStation[];
  similarModels?: SimilarModel[];
  costSummary?: CostSummary;
  // For additional process form (Phase 8)
  showProcessForm?: boolean;
  additionalProcessData?: AdditionalProcessData;
  selectedModelId?: string;
  // For investment report display
  showInvestmentReport?: boolean;
  referenceModel?: {
    code: string;
    customer: string;
    similarity: number;
    totalStations: number;
    totalManpower: number;
  };
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
