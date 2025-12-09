/**
 * RFQ Chat API - Phase 6E v2
 * AI Agent with Function Calling + RAG + Vision (OpenRouter)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processAgentMessage,
  isAgentAvailable,
  type AgentMessage,
  type AgentResponse,
  type SimilarModel,
} from '@/lib/llm/agent-v2';

/**
 * Request body type
 */
interface ChatRequest {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  customerId?: string;
  existingStations?: string[];
  image?: string; // Base64 encoded image
}

/**
 * Response body type
 */
interface ChatAPIResponse {
  success: boolean;
  content?: string;
  stations?: AgentResponse['stations'];
  similarModels?: SimilarModel[];
  actions?: AgentResponse['actions'];
  toolsUsed?: string[];
  error?: string;
}

/**
 * POST - Process chat message with AI Agent
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history, customerId, existingStations, image } = body;

    // Validate message - allow empty if image is present
    if (typeof message !== 'string') {
      return NextResponse.json<ChatAPIResponse>(
        { success: false, error: 'Message must be a string' },
        { status: 400 }
      );
    }
    
    // Require message OR image
    if (!message.trim() && !image) {
      return NextResponse.json<ChatAPIResponse>(
        { success: false, error: 'Please provide a message or upload an image' },
        { status: 400 }
      );
    }
    
    // Auto-fill message for image-only uploads
    const effectiveMessage = message.trim() || 'Please extract the station list from this image.'

    // Check if agent is available
    if (!isAgentAvailable()) {
      return NextResponse.json<ChatAPIResponse>(
        { success: false, error: 'AI Agent not configured (OPENROUTER_API_KEY missing)' },
        { status: 503 }
      );
    }

    // Convert history format
    const agentHistory: AgentMessage[] = (history || []).map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // Process with AI Agent (includes function calling + RAG + vision)
    const response = await processAgentMessage(
      effectiveMessage,
      agentHistory,
      { customerId, existingStations, image }
    );

    return NextResponse.json<ChatAPIResponse>({
      success: true,
      content: response.content,
      stations: response.stations,
      similarModels: response.similarModels,
      actions: response.actions,
      toolsUsed: response.toolsUsed,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json<ChatAPIResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check API status
 */
export async function GET() {
  const agentAvailable = isAgentAvailable();

  return NextResponse.json({
    success: true,
    status: agentAvailable ? 'ready' : 'limited',
    agentAvailable,
    provider: 'OpenRouter',
    features: {
      functionCalling: agentAvailable,
      ragSearch: agentAvailable,
      databaseQueries: true,
      vision: agentAvailable,
    },
    welcomeMessage: `Halo! Saya RFQ Assistant dengan kemampuan AI.

Saya bisa membantu menentukan test station untuk produk Anda dengan:
- Mencari data dari knowledge base EMS
- Menganalisis historical data customer
- Merekomendasikan station berdasarkan fitur produk
- Membaca screenshot/gambar tabel station

Ceritakan tentang produk Anda atau sebutkan brand/customer-nya.`,
  });
}
