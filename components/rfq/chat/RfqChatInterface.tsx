'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChatInput } from './ChatInput';
import { ModeSwitch } from './ModeSwitch';
import { QuickActions } from './QuickActions';
import { MessageBubble } from './MessageBubble';
import { FilePreview } from './FilePreview';
import { ExtractionResult } from './ExtractionResult';
import { ProcessingIndicator } from './ProcessingIndicator';
import { SimilarModelsCard } from './SimilarModelsCard';
import { ModelComparisonModal } from './ModelComparisonModal';
import type {
  RfqChatState,
  ChatMessage,
  QuickActionType,
  SimilarModel,
  AgentChatResponse,
} from './types';
import type { ExtractedStation } from '@/lib/excel-parser/types';
import { detectInputType } from '@/lib/excel-parser/detector';
import { parseTable, mergeMultiRowHeaders } from '@/lib/excel-parser/table-parser';
import { detectColumns } from '@/lib/excel-parser/column-detector';
import { extractStations } from '@/lib/excel-parser/extractor';

const initialState: RfqChatState = {
  mode: 'normal',
  messages: [],
  extractedStations: [],
  uploadedFiles: [],
  isProcessing: false,
  processingStep: null,
  canProceed: false,
  selectedCustomer: null,
  skippedCount: 0,
  similarModels: undefined,
  selectedModel: undefined,
};

export function RfqChatInterface() {
  const router = useRouter();
  const [state, setState] = useState<RfqChatState>(initialState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.extractedStations, state.similarModels]);

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
    setState((s) => ({
      ...s,
      isProcessing: true,
      processingStep: 'Detecting format...',
    }));

    try {
      // If files uploaded, process files
      if (files?.length) {
        const file = files[0];
        const isImage = file.type.startsWith('image/');
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        
        // For images, switch to AI Agent mode to use vision
        if (isImage) {
          toast.info('Image detected. Switching to AI Agent for processing...', { duration: 2000 });
          setState((s) => ({ ...s, mode: 'ai_agent', isProcessing: false }));
          // Process with AI Agent
          await processAiAgentMode('Please extract the station list from this image/screenshot.', files);
          return;
        }
        
        // For Excel files, try to parse
        if (isExcel) {
          toast.info('Excel file detected. For best results, please copy and paste the data directly from Excel.', { duration: 5000 });
          setState((s) => ({
            ...s,
            uploadedFiles: [{ name: file.name, size: file.size, type: file.type }],
            isProcessing: false,
            processingStep: null,
          }));
          return;
        }
        
        // For CSV/text files
        setState((s) => ({ ...s, processingStep: 'Processing files...' }));
        const result = await processFiles(files);
        setState((s) => ({
          ...s,
          extractedStations: result.stations,
          skippedCount: result.skipped,
          uploadedFiles: files.map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          })),
          canProceed: result.stations.length > 0,
        }));
      }
      // If text input, parse as station list or Excel paste
      else if (input.trim()) {
        setState((s) => ({ ...s, processingStep: 'Analyzing input...' }));
        const result = await parseInput(input);

        if (result.isQuestion) {
          // User is asking a question in Normal mode - suggest switching to AI Agent
          toast.info(
            'Sepertinya Anda bertanya. Switching to AI Agent mode...',
            { duration: 3000 }
          );
          // Auto-switch to AI Agent mode and process
          setState((s) => ({ ...s, mode: 'ai_agent' }));
          await processAiAgentMode(input, files);
          return;
        }

        if (result.stations.length > 0) {
          setState((s) => ({
            ...s,
            extractedStations: result.stations,
            skippedCount: result.skipped,
            canProceed: true,
          }));
        } else {
          // No stations found, show message
          toast.info('No stations detected. Try pasting Excel data or switch to AI Agent mode.');
        }
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process input. Please try again.');
    } finally {
      setState((s) => ({ ...s, isProcessing: false, processingStep: null }));
    }
  };

  // AI Agent mode: conversational
  const processAiAgentMode = async (input: string, files?: File[]) => {
    // Process image if present
    let imageBase64: string | undefined;
    if (files?.length) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        imageBase64 = await fileToBase64(file);
      }
    }
    
    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: files?.map((f) => ({
        type: 'file' as const,
        data: { name: f.name, size: f.size, type: f.type },
      })),
    };

    setState((s) => ({
      ...s,
      messages: [...s.messages, userMessage],
      uploadedFiles: files?.map((f) => ({ name: f.name, size: f.size, type: f.type })) || s.uploadedFiles,
      isProcessing: true,
      processingStep: imageBase64 ? 'Analyzing image...' : 'Thinking...',
    }));

    try {
      // Call AI API
      const response = await fetch('/api/rfq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: state.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          customerId: state.selectedCustomer,
          image: imageBase64, // Send image if present
        }),
      });

      const data: AgentChatResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content || '',
        timestamp: new Date(),
        data: {
          stations: data.stations,
          similarModels: data.similarModels,
          questions: data.questions,
          warnings: data.warnings,
          toolsUsed: data.toolsUsed,
        },
        actions: data.actions?.map((a) => ({
          id: a.id,
          label: a.label,
          action: a.id,
          variant: a.type,
        })),
      };

      // Only update extractedStations if we have valid station data
      const validStations = data.stations?.filter(
        (st) => st.code && st.code.length <= 30 && /^[A-Z0-9_]+$/i.test(st.code)
      );

      setState((s) => ({
        ...s,
        messages: [...s.messages, assistantMessage],
        extractedStations:
          validStations && validStations.length > 0
            ? validStations.map((st) => ({
                name: st.code,
                section: null,
                description: st.reason,
                originalRow: 0,
                status: null,
              }))
            : s.extractedStations,
        similarModels: data.similarModels?.length ? data.similarModels : s.similarModels,
        canProceed:
          (validStations?.length || 0) > 0 || s.extractedStations.length > 0,
      }));
    } catch (error) {
      console.error('AI Agent error:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}. Silakan coba lagi.`,
        timestamp: new Date(),
      };
      
      setState((s) => ({
        ...s,
        messages: [...s.messages, errorMessage],
      }));
    } finally {
      setState((s) => ({ ...s, isProcessing: false, processingStep: null }));
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/png;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  // Parse text input (Excel paste or station list)
  const parseInput = async (
    input: string
  ): Promise<{ stations: ExtractedStation[]; skipped: number; isQuestion?: boolean }> => {
    const detection = detectInputType(input);

    // Check if it's a question/natural language
    if (detection.isQuestion || detection.type === 'unknown') {
      return { stations: [], skipped: 0, isQuestion: detection.isQuestion };
    }

    if (detection.type === 'excel_table') {
      let table = parseTable(input);
      table = mergeMultiRowHeaders(table);
      const columns = detectColumns(table);

      // Auto-extract if high confidence
      if (columns.confidence > 0.6 && columns.stationNameColumn !== null) {
        const result = extractStations(table, {
          stationNameColumn: columns.stationNameColumn,
          statusColumn: columns.statusColumn,
          statusFilterValue: '1',
          sectionColumn: columns.sectionColumn,
          skipHeaderRows: 1,
          includeDescription: false,
        });
        return { stations: result.stations, skipped: result.skippedRows };
      }
    }

    // Try simple list parsing
    if (detection.type === 'simple_list' || detection.type === 'inline_list') {
      const lines = input
        .split(/[\n,;]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && l.length <= 30);

      const stations: ExtractedStation[] = lines.map((name, i) => ({
        name: name.toUpperCase(),
        section: null,
        description: null,
        originalRow: i,
        status: null,
      }));

      return { stations, skipped: 0 };
    }

    return { stations: [], skipped: 0 };
  };

  // Process uploaded files
  const processFiles = async (
    files: File[]
  ): Promise<{ stations: ExtractedStation[]; skipped: number }> => {
    const file = files[0];
    if (!file) return { stations: [], skipped: 0 };

    // Read file content
    const text = await file.text();

    // If CSV or text, parse directly
    if (file.name.endsWith('.csv') || file.type.includes('text')) {
      const result = await parseInput(text);
      return { stations: result.stations, skipped: result.skipped };
    }

    return { stations: [], skipped: 0 };
  };

  // Handle model selection from SimilarModelsCard
  const handleSelectModel = useCallback((model: SimilarModel) => {
    setState((s) => ({ ...s, selectedModel: model }));
  }, []);

  // Handle use model from comparison modal
  const handleUseModel = useCallback((model: SimilarModel) => {
    // Store selected model data
    sessionStorage.setItem('rfq_selected_model', JSON.stringify(model));
    sessionStorage.setItem('rfq_stations', JSON.stringify(
      model.all_stations.map((code, i) => ({
        name: code,
        section: null,
        description: null,
        originalRow: i,
        status: null,
      }))
    ));
    sessionStorage.setItem('rfq_mode', state.mode);
    
    toast.success(`Model ${model.code} dipilih`);
    setState((s) => ({ ...s, selectedModel: undefined }));
    router.push('/rfq/new/comparison');
  }, [state.mode, router]);

  // Close comparison modal
  const handleCloseModal = useCallback(() => {
    setState((s) => ({ ...s, selectedModel: undefined }));
  }, []);

  // Handle message action (from AI Agent)
  const handleMessageAction = useCallback(
    (action: string, data?: Record<string, unknown>) => {
      switch (action) {
        case 'accept':
          if (state.extractedStations.length > 0) {
            handleProceed();
          }
          break;
        case 'modify':
          toast.info('Modification feature coming soon');
          break;
        case 'proceed':
          handleProceed();
          break;
        case 'select_model':
          if (state.similarModels?.length) {
            // Show first model details
            handleSelectModel(state.similarModels[0]);
          }
          break;
        case 'compare_all':
          toast.info('Compare all feature coming soon');
          break;
        case 'export':
          toast.info('Export feature coming soon');
          break;
        default:
          console.log('Unknown action:', action, data);
      }
    },
    [state.extractedStations, state.similarModels, handleSelectModel]
  );

  // Handle quick actions
  const handleQuickAction = useCallback((action: QuickActionType) => {
    switch (action) {
      case 'paste':
        toast.info('Paste your station list in the text area');
        break;
      case 'excel':
      case 'pdf':
        fileInputRef.current?.click();
        break;
      case 'manual':
        toast.info('Type station names separated by commas or new lines');
        break;
    }
  }, []);

  // Handle file input change (from quick actions)
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        handleSubmit('', files);
      }
      e.target.value = '';
    },
    [handleSubmit]
  );

  // Remove uploaded file
  const handleRemoveFile = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      uploadedFiles: s.uploadedFiles.filter((_, i) => i !== index),
      extractedStations:
        s.uploadedFiles.length === 1 ? [] : s.extractedStations,
      canProceed: s.uploadedFiles.length > 1,
    }));
  }, []);

  // Proceed to comparison page
  const handleProceed = useCallback(() => {
    if (state.extractedStations.length === 0) {
      toast.error('No stations to proceed with');
      return;
    }

    sessionStorage.setItem(
      'rfq_stations',
      JSON.stringify(state.extractedStations)
    );
    sessionStorage.setItem('rfq_mode', state.mode);

    router.push('/rfq/new/comparison');
  }, [state.extractedStations, state.mode, router]);

  // Get query stations for comparison
  const queryStations = state.extractedStations.map((s) => s.name);

  // Get placeholder text based on mode
  const getPlaceholder = () => {
    if (state.mode === 'normal') {
      return 'Paste station list, upload Excel/PDF, or type stations...';
    }
    return 'Describe your product or ask questions...';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Hidden file input for quick actions */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg"
        multiple
        onChange={handleFileInputChange}
      />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Welcome Message */}
        {state.messages.length === 0 && state.extractedStations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Hi there!</p>
            <h2 className="text-2xl font-medium mt-2">Where should we start?</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              {state.mode === 'normal'
                ? 'Paste your station list from Excel, upload a file, or type station names.'
                : 'Describe your product and I\'ll recommend the test stations you need.'}
            </p>
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
            processing={state.isProcessing}
          />
        )}

        {/* Similar Models (from AI Agent) */}
        {state.similarModels && state.similarModels.length > 0 && !state.isProcessing && (
          <div className="my-4 max-w-2xl mx-auto">
            <SimilarModelsCard
              models={state.similarModels}
              queryStations={queryStations}
              onSelectModel={handleSelectModel}
            />
          </div>
        )}

        {/* Extraction Result (only if no similar models shown) */}
        {state.extractedStations.length > 0 && 
         !state.isProcessing && 
         (!state.similarModels || state.similarModels.length === 0) && (
          <ExtractionResult
            stations={state.extractedStations}
            skipped={state.skippedCount}
            onProceed={handleProceed}
            onModify={() => toast.info('Modification feature coming soon')}
          />
        )}

        {/* Processing Indicator */}
        {state.isProcessing && (
          <ProcessingIndicator step={state.processingStep} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t px-4 py-4 space-y-3 bg-background">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={state.isProcessing}
          placeholder={getPlaceholder()}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <QuickActions onAction={handleQuickAction} disabled={state.isProcessing} />
          <ModeSwitch
            mode={state.mode}
            onChange={(m) => setState((s) => ({ ...s, mode: m }))}
            disabled={state.isProcessing}
          />
        </div>
      </div>

      {/* Model Comparison Modal */}
      {state.selectedModel && (
        <ModelComparisonModal
          model={state.selectedModel}
          queryStations={queryStations}
          onClose={handleCloseModal}
          onUseModel={handleUseModel}
        />
      )}
    </div>
  );
}
