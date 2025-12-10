"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeScreen } from "./WelcomeScreen";
import { MessageList } from "./MessageList";
import { useChatHistory, ChatMessage } from "@/hooks/useChatHistory";
import { ProcessingOverlay } from "../loading/ProcessingOverlay";
import { ModelDetailModal } from "../results/ModelDetailModal";
import { DEFAULT_PROCESSING_STEPS } from "@/lib/constants/processing-steps";
import { SimilarModel } from "../results/ModelCard";
import { ExtractedStation } from "../results/ExtractedDataTable";

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

interface ChatMainProps {
  chatId?: string;
}

export function ChatMain({ chatId }: ChatMainProps) {
  const router = useRouter();
  const { getMessages, addMessage, createSession } = useChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [showProcessing, setShowProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<SimilarModel | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [currentStations, setCurrentStations] = useState<ExtractedStation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages when chat changes (async)
  useEffect(() => {
    const loadMessages = async () => {
      if (chatId) {
        setIsLoadingMessages(true);
        const msgs = await getMessages(chatId);
        setMessages(msgs);

        // Extract stations from last assistant message with extractedStations
        const lastStationsMsg = [...msgs].reverse().find(m => m.extractedStations && m.extractedStations.length > 0);
        if (lastStationsMsg?.extractedStations) {
          setCurrentStations(lastStationsMsg.extractedStations);
        }

        setIsLoadingMessages(false);
      } else {
        setMessages([]);
        setCurrentStations([]);
      }
    };
    loadMessages();
  }, [chatId, getMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (content: string, files?: File[]) => {
    let currentChatId: string | undefined = chatId;

    // Create new chat if needed (async)
    if (!currentChatId) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      const newSessionId = await createSession(title);
      if (!newSessionId) {
        console.error("Failed to create session");
        return;
      }
      currentChatId = newSessionId;
      // Navigate to the new chat URL
      router.push(`/chat/${currentChatId}`);
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

    // Show processing overlay if files are present
    if (files && files.length > 0) {
      setShowProcessing(true);
      setProcessingStep(0);

      // Simulate step progression (replace with real progress later)
      stepIntervalRef.current = setInterval(() => {
        setProcessingStep(prev => {
          if (prev >= DEFAULT_PROCESSING_STEPS.length - 1) {
            if (stepIntervalRef.current) {
              clearInterval(stepIntervalRef.current);
            }
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }

    try {
      // Save user message to database
      await addMessage(currentChatId, {
        role: "user",
        content,
        files: files?.map(f => ({ name: f.name, type: f.type, size: f.size })),
      });

      // Convert image to base64 if present
      let imageBase64: string | undefined;
      if (files && files.length > 0) {
        const imageFile = files.find(f => f.type.startsWith('image/'));
        if (imageFile) {
          imageBase64 = await fileToBase64(imageFile);
        }
      }

      // Build conversation history for API
      const history = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Call RFQ Chat API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/rfq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history,
          image: imageBase64,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      // Convert similar models to expected format
      const similarModels: SimilarModel[] | undefined = data.similarModels?.map((m: any) => ({
        id: m.id,
        code: m.code,
        customerName: m.customer,
        customerCode: m.customer_code,
        similarity: m.similarity,
        totalStations: m.total_stations,
        totalManpower: m.total_manpower,
        matchedStations: m.matched_stations || [],
        missingStations: m.missing_stations || [],
        extraStations: m.extra_stations || [],
        allStations: m.all_stations || [],
      }));

      // Convert extracted stations
      const extractedStations: ExtractedStation[] | undefined = data.stations?.map((s: any) => ({
        code: s.code,
        name: s.name,
        confidence: s.confidence,
        reason: s.reason,
      }));

      // Update current stations if extracted
      if (extractedStations && extractedStations.length > 0) {
        setCurrentStations(extractedStations);
      }

      // Save assistant response to database
      const assistantResponse = await addMessage(currentChatId, {
        role: "assistant",
        content: data.content,
        extractedStations,
        similarModels,
      });

      if (assistantResponse) {
        setMessages(prev => [...prev, assistantResponse]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Determine error message
      let errorMsg = 'Gagal memproses pesan';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMsg = 'Request timeout (60 detik). Server mungkin sibuk, silakan coba lagi.';
        } else {
          errorMsg = error.message;
        }
      }
      
      // Show error message to user
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ Maaf, terjadi kesalahan: ${errorMsg}`,
        timestamp: new Date(),
        sequence: messages.length + 2,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Clear interval if still running
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current);
      }
      setIsLoading(false);
      setShowProcessing(false);
      setProcessingStep(0);
    }
  };

  const handleStationsChange = (stations: ExtractedStation[]) => {
    setCurrentStations(stations);
  };

  const handleFindSimilar = async (stations: ExtractedStation[]) => {
    setCurrentStations(stations);
    // Trigger similarity search
    await handleSendMessage(
      `Mencari model serupa untuk ${stations.length} stations: ${stations.map(s => s.code).join(", ")}`
    );
  };

  const handleSelectModel = (model: SimilarModel) => {
    setSelectedModel(model);
    setShowModelModal(true);
  };

  const handleUseModel = (model: SimilarModel) => {
    setShowModelModal(false);
    // Add confirmation message
    handleSendMessage(
      `Menggunakan model ${model.customerName} - ${model.code} sebagai referensi.`
    );
  };

  // Show welcome screen if no messages
  if (messages.length === 0 && !isLoading) {
    return (
      <>
        <ProcessingOverlay
          isVisible={showProcessing}
          currentStep={processingStep}
          steps={DEFAULT_PROCESSING_STEPS}
        />
        <WelcomeScreen onSendMessage={handleSendMessage} />
      </>
    );
  }

  return (
    <>
      <ProcessingOverlay
        isVisible={showProcessing}
        currentStep={processingStep}
        steps={DEFAULT_PROCESSING_STEPS}
      />
      <MessageList
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        messagesEndRef={messagesEndRef}
        onStationsChange={handleStationsChange}
        onFindSimilar={handleFindSimilar}
        onSelectModel={handleSelectModel}
      />

      {/* Model Detail Modal */}
      <ModelDetailModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        model={selectedModel}
        queryStations={currentStations}
        onUseModel={handleUseModel}
      />
    </>
  );
}
