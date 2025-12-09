'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIAssistantChat } from '@/components/rfq/AIAssistantChat';
import type { SimilarModel, ResolvedStation, ResolutionResult } from '@/lib/rfq/types';

interface AIAssistantStepProps {
  data: {
    resolution?: ResolutionResult;
    customerId?: string;
    modelName?: string;
    similarModels?: SimilarModel[];
    confirmedStations?: string[];
  };
  onChange: (data: any) => void;
  rfqId?: string;
}

export function AIAssistantStep({ data, onChange, rfqId }: AIAssistantStepProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'chat' | 'confirmed'>('chat');
  const [confirmedStations, setConfirmedStations] = useState<string[]>(data?.confirmedStations || []);
  const [similarModels, setSimilarModels] = useState<SimilarModel[]>(data?.similarModels || []);

  // Handle stations confirmed from AI chat
  const handleStationsConfirmed = useCallback((stations: string[]) => {
    setConfirmedStations(stations);
    setPhase('confirmed');

    // Create resolution result in compatible format
    const resolution: ResolutionResult = {
      stations: stations.map(code => ({
        input: code,
        inputDescription: undefined,
        inputBoardType: undefined,
        resolvedCode: code,
        resolvedName: code, // Will be enhanced later
        confidence: 'high' as const,
        matchMethod: 'exact' as const,
        reasoning: 'Confirmed by AI Assistant',
      })),
      summary: {
        total: stations.length,
        resolved: stations.length,
        unresolved: 0,
        uniqueCodes: stations,
        byMethod: {
          exact: stations.length, // All from AI are treated as exact since AI confirmed
          alias: 0,
          semantic: 0,
          unresolved: 0,
        },
      },
    };

    onChange({
      ...data,
      resolution,
      confirmedStations: stations,
      inputSource: 'ai_assistant',
    });

    toast.success(`${stations.length} station berhasil dikonfirmasi dari AI Assistant`);
  }, [data, onChange]);

  // Handle similar models found
  const handleSimilarModelsFound = useCallback((models: SimilarModel[], stations: string[]) => {
    setSimilarModels(models);
    setConfirmedStations(stations);

    // Update parent with similar models
    onChange({
      ...data,
      similarModels: models,
      hasMatches: models.length > 0,
      confirmedStations: stations,
    });
  }, [data, onChange]);

  // Navigate to model details
  const handleViewModelDetails = useCallback((modelId: string, stations: string[]) => {
    const codesParam = stations.join(',');
    const basePath = rfqId ? `/rfq/${rfqId}/results/${modelId}` : `/rfq/compare/${modelId}`;
    router.push(`${basePath}?codes=${encodeURIComponent(codesParam)}`);
  }, [rfqId, router]);

  // Continue to next step
  const handleContinue = useCallback(() => {
    if (confirmedStations.length === 0) {
      toast.error('Silakan konfirmasi station terlebih dahulu');
      return;
    }

    // Signal to wizard to go to next step
    onChange({
      ...data,
      goToStep: 'next',
    });
  }, [confirmedStations, data, onChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          AI Assistant
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Ceritakan tentang produk Anda dan AI akan membantu menentukan station yang dibutuhkan.
        </p>
      </div>

      {/* Status Banner (when stations confirmed) */}
      {phase === 'confirmed' && confirmedStations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Station Dikonfirmasi
                </h4>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {confirmedStations.length} station siap untuk similarity search
                </p>
              </div>
            </div>
            <Button onClick={handleContinue} className="gap-2">
              Lanjutkan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Station badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            {confirmedStations.map((code) => (
              <Badge key={code} variant="secondary" className="font-mono">
                {code}
              </Badge>
            ))}
          </div>
        </motion.div>
      )}

      {/* Similar Models Found Banner */}
      {similarModels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4"
        >
          <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
            🏆 {similarModels.length} Model Serupa Ditemukan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {similarModels.slice(0, 3).map((model, idx) => (
              <div
                key={model.modelId}
                className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-100 dark:border-blue-900"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{['🥇', '🥈', '🥉'][idx]}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {model.similarity}%
                  </span>
                </div>
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {model.modelCode}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {model.customerName}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-xs mt-1"
                  onClick={() => handleViewModelDetails(model.modelId, confirmedStations)}
                >
                  Lihat Detail →
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Chat Component */}
      <AIAssistantChat
        onStationsConfirmed={handleStationsConfirmed}
        onSimilarModelsFound={handleSimilarModelsFound}
        onViewModelDetails={handleViewModelDetails}
      />

      {/* Tips */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          💡 Tips untuk hasil terbaik:
        </h4>
        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Sebutkan jenis produk (smartphone, IoT, wearable, dll)</li>
          <li>• Jelaskan fitur utama (WiFi, Bluetooth, display, sensor)</li>
          <li>• Beritahu jika ada komponen khusus (BGA, battery Li-ion)</li>
          <li>• Tanyakan jika ada yang kurang jelas</li>
        </ul>
      </div>
    </div>
  );
}

export default AIAssistantStep;
