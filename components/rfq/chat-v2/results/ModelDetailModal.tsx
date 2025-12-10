"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  X,
  FileText,
  FileSpreadsheet,
  CheckCircle,
  Cpu,
  CircuitBoard,
  Lightbulb,
  Usb,
  Radio,
  Box,
  LayoutGrid,
} from "lucide-react";
import { SimilarModel } from "./ModelCard";
import { ExtractedStation } from "./ExtractedDataTable";
import { ComparisonTable } from "./ComparisonTable";
import { InvestmentSummary } from "./InvestmentSummary";
import { BoardStationsTable } from "./BoardStationsTable";
import { ScoreRing } from "./ScoreRing";

// Board type icons
const BOARD_ICONS: Record<string, React.ElementType> = {
  "Main Board": Cpu,
  "Sub Board": CircuitBoard,
  "LED Board": Lightbulb,
  "USB Board": Usb,
  "SUB_ANT Board": Radio,
  default: Box,
};

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
  const [activeTab, setActiveTab] = useState<string>("overview");

  if (!model) return null;

  const rankEmoji =
    model.similarity >= 0.85
      ? "🥇"
      : model.similarity >= 0.7
        ? "🥈"
        : "🥉";

  // Check if model has boards data
  const hasBoards = model.boards && model.boards.length > 0;

  // Format currency
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get model stations for comparison (from allStations or generate from boards)
  const getModelStations = (): string[] => {
    if (model.allStations && model.allStations.length > 0) {
      return model.allStations;
    }
    // Fallback to common stations based on count
    const commonStations = [
      "MBT",
      "CAL1",
      "CAL2",
      "RFT",
      "WIFIBT",
      "4G_INSTRUMENT",
      "MAINBOARD_MMI",
      "VISUAL",
      "PACKING",
    ];
    return commonStations.slice(0, model.stationCount || model.totalStations);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] sm:max-h-[85vh] p-0 gap-0 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 overflow-hidden mx-2 sm:mx-auto">
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
                  <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    {model.customerName} - {model.code || model.typeModel}
                    {hasBoards && (
                      <Badge variant="secondary" className="ml-2">
                        {model.totalBoards || model.boards?.length} Board
                        {(model.totalBoards || model.boards?.length || 0) > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </DialogTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {typeof model.matchedStations === 'number'
                      ? model.matchedStations
                      : model.matchedStations?.length || 0}{" "}
                    dari {model.stationCount || model.totalStations} stations match
                    {model.totalInvestment && (
                      <> • Investment: {formatRupiah(model.totalInvestment)}</>
                    )}
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

            {/* Content with Board Type Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <div className="border-b border-slate-200 dark:border-slate-700 px-6 pt-2">
                <TabsList className="bg-transparent h-auto p-0 gap-1 flex-wrap">
                  {/* Overview Tab */}
                  <TabsTrigger
                    value="overview"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-600 flex items-center gap-2 px-4 py-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Overview
                  </TabsTrigger>

                  {/* Board Type Tabs (if available) */}
                  {hasBoards &&
                    model.boards!.map((board) => {
                      const Icon = BOARD_ICONS[board.boardType] || BOARD_ICONS.default;
                      return (
                        <TabsTrigger
                          key={board.id}
                          value={board.id}
                          className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-600 flex items-center gap-2 px-4 py-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{board.boardType}</span>
                          <span className="sm:hidden">{board.boardType.split(" ")[0]}</span>
                          {board.emmcSize && board.emmcSize !== "0GB" && (
                            <span className="text-xs opacity-70 hidden md:inline">
                              ({board.ramSize}/{board.emmcSize})
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                </TabsList>
              </div>

              <ScrollArea className="flex-1 px-6 py-4">
                {/* Overview Tab Content */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  {/* Investment Summary */}
                  <InvestmentSummary
                    model={model}
                    showBoardBreakdown={hasBoards}
                  />

                  {/* Station Comparison */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      Station Comparison
                    </h3>
                    <ComparisonTable
                      queryStations={queryStations}
                      modelStations={getModelStations()}
                    />
                  </div>
                </TabsContent>

                {/* Individual Board Tab Contents */}
                {hasBoards &&
                  model.boards!.map((board) => (
                    <TabsContent key={board.id} value={board.id} className="mt-0 space-y-6">
                      {/* Board Info Card */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                              {board.boardType}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Model: {board.code}
                            </p>
                          </div>
                          {board.emmcSize && board.emmcSize !== "0GB" && (
                            <div className="text-right">
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                Variant
                              </p>
                              <p className="text-lg font-semibold text-slate-800 dark:text-white">
                                {board.ramSize} / {board.emmcSize}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Board Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-900">
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                              {board.stationCount}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Stations
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-900">
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                              {board.manpower}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Manpower
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-lg bg-white dark:bg-slate-900">
                            <p className="text-lg font-bold text-slate-800 dark:text-white">
                              {formatRupiah(board.investment).replace("IDR", "Rp")}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Investment
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Board Stations Table */}
                      <BoardStationsTable boardId={board.id} boardType={board.boardType} />
                    </TabsContent>
                  ))}
              </ScrollArea>
            </Tabs>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 dark:border-slate-600"
                >
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
