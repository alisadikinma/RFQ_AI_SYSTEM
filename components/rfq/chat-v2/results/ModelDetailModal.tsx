"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, FileText, FileSpreadsheet, CheckCircle } from "lucide-react";
import { SimilarModel } from "./ModelCard";
import { ExtractedStation } from "./ExtractedDataTable";
import { ComparisonTable } from "./ComparisonTable";
import { InvestmentSummary } from "./InvestmentSummary";
import { ScoreRing } from "./ScoreRing";

interface ModelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: SimilarModel | null;
  queryStations: ExtractedStation[];
  onUseModel: (model: SimilarModel) => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

export function ModelDetailModal({
  isOpen,
  onClose,
  model,
  queryStations,
  onUseModel,
}: ModelDetailModalProps) {
  if (!model) return null;

  const rankEmoji =
    model.similarity >= 0.85 ? "🥇" :
    model.similarity >= 0.70 ? "🥈" : "🥉";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 overflow-hidden mx-2 sm:mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={model.id}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col h-full"
          >
            {/* Header */}
            <DialogHeader className="relative px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center gap-4">
                {/* Rank & Score */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{rankEmoji}</span>
                  <ScoreRing score={Math.round(model.similarity * 100)} size="sm" />
                </div>

                {/* Model Info */}
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">
                    {model.customerName} - {model.code}
                  </DialogTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {model.matchedStations} dari {model.stationCount} stations match
                  </p>
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogHeader>

            {/* Content Tabs */}
            <Tabs defaultValue="comparison" className="flex-1 flex flex-col">
              <TabsList className="mx-6 mt-4 bg-slate-100 dark:bg-slate-800/50">
                <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Perbandingan Station
                </TabsTrigger>
                <TabsTrigger value="investment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Investment Summary
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 px-6 py-4">
                <TabsContent value="comparison" className="mt-0">
                  <ComparisonTable
                    queryStations={queryStations}
                    modelStations={generateModelStations(model)}
                  />
                </TabsContent>

                <TabsContent value="investment" className="mt-0">
                  <InvestmentSummary model={model} />
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
              <Button
                onClick={() => onUseModel(model)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Gunakan Model Ini
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to generate model stations for comparison
function generateModelStations(model: SimilarModel): string[] {
  // This would come from the API in real implementation
  // For now, mock based on stationCount
  const commonStations = [
    "MBT", "CAL1", "CAL2", "RFT", "WIFIBT",
    "4G_INSTRUMENT", "MAINBOARD_MMI", "VISUAL", "PACKING"
  ];
  return commonStations.slice(0, model.stationCount);
}
