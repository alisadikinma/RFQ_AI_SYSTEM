"use client";

import { ChatMessage, AdditionalProcessData } from "@/hooks/useChatHistory";
import { User, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ExtractedDataTable, ExtractedStation } from "../results/ExtractedDataTable";
import { SimilarModelCards } from "../results/SimilarModelCards";
import { SimilarModel } from "../results/ModelCard";
import { QuickProcessForm } from "../../QuickProcessForm";
import { InvestmentSummaryReport } from "../../InvestmentSummaryReport";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: ChatMessage;
  onStationsChange?: (stations: ExtractedStation[]) => void;
  onFindSimilar?: (stations: ExtractedStation[]) => void;
  onSelectModel?: (model: SimilarModel) => void;
  onProcessComplete?: (data: AdditionalProcessData) => void;
}

// Custom Markdown components for beautiful rendering
const MarkdownComponents = {
  // Headers
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-slate-900 dark:text-white">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-slate-800 dark:text-slate-100">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0 text-slate-800 dark:text-slate-100">
      {children}
    </h3>
  ),
  
  // Paragraphs
  p: ({ children }: any) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  
  // Bold & Italic
  strong: ({ children }: any) => (
    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
  ),
  
  // Lists
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside mb-3 space-y-1 ml-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-3 space-y-1 ml-2">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="text-slate-700 dark:text-slate-300">{children}</li>
  ),
  
  // Code
  code: ({ inline, children }: any) => {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-pink-600 dark:text-pink-400 text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="block p-3 rounded-lg bg-slate-900 dark:bg-slate-950 text-green-400 text-sm font-mono overflow-x-auto my-2">
        {children}
      </code>
    );
  },
  pre: ({ children }: any) => (
    <pre className="rounded-lg overflow-hidden my-2">{children}</pre>
  ),
  
  // Tables - fancy styling
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
      {children}
    </td>
  ),
  
  // Blockquotes
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-2 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg">
      {children}
    </blockquote>
  ),
  
  // Horizontal rule
  hr: () => (
    <hr className="my-4 border-slate-200 dark:border-slate-700" />
  ),
  
  // Links
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 hover:underline"
    >
      {children}
    </a>
  ),
};

export function MessageBubble({
  message,
  onStationsChange,
  onFindSimilar,
  onSelectModel,
  onProcessComplete
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const hasResults = message.extractedStations || message.similarModels || message.showProcessForm || message.showInvestmentReport;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-4", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-600" : "bg-gradient-to-br from-purple-500 to-pink-500"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex-1 max-w-[80%]",
          !hasResults && "rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white ml-auto rounded-2xl px-4 py-3"
            : !hasResults && "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl px-4 py-3"
        )}
      >
        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.files.map((file, index) => (
              <span
                key={index}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded text-xs",
                  isUser ? "bg-blue-500/30" : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                {file.name}
              </span>
            ))}
          </div>
        )}

        {/* Text content with Markdown rendering */}
        {message.content && (
          <div className={cn(
            hasResults && !isUser && "text-slate-800 dark:text-slate-100 mb-4"
          )}>
            {isUser ? (
              // User messages: plain text (preserve whitespace)
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              // AI messages: render Markdown
              <div className="prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={MarkdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Extracted Stations Table */}
        {message.extractedStations && message.extractedStations.length > 0 && (
          <div className="mt-4">
            <ExtractedDataTable
              stations={message.extractedStations}
              onStationsChange={onStationsChange || (() => {})}
              onFindSimilar={onFindSimilar || (() => {})}
            />
          </div>
        )}

        {/* Similar Models Cards */}
        {message.similarModels && message.similarModels.length > 0 && (
          <div className="mt-4">
            <SimilarModelCards
              models={message.similarModels}
              onSelectModel={onSelectModel || (() => {})}
            />
          </div>
        )}

        {/* Additional Process Form */}
        {message.showProcessForm && onProcessComplete && (
          <div className="mt-4">
            <QuickProcessForm onComplete={onProcessComplete} />
          </div>
        )}

        {/* Investment Summary Report */}
        {message.showInvestmentReport && message.additionalProcessData && (
          <div className="mt-4">
            <InvestmentSummaryReport
              selections={message.additionalProcessData.selections}
              totalManpower={message.additionalProcessData.totalManpower}
              totalInvestment={message.additionalProcessData.totalInvestment}
              monthlyLaborCost={message.additionalProcessData.monthlyLaborCost}
              referenceModel={message.referenceModel}
            />
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            "text-xs mt-2",
            isUser ? "text-blue-200" : "text-slate-400 dark:text-slate-500"
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
}
