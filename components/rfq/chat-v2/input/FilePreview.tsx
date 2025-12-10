"use client";

import { X, FileSpreadsheet, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  metadata?: Record<string, any>;
}

interface FilePreviewProps {
  file: UploadedFile;
  onRemove: () => void;
  onClick?: () => void;
}

export function FilePreview({ file, onRemove, onClick }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");
  const isExcel = file.type.includes("spreadsheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
  const isPDF = file.type === "application/pdf";

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02 }}
      className="relative group"
    >
      <div
        className="relative flex items-center gap-3 p-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 cursor-pointer transition-colors"
        onClick={onClick}
      >
        {/* Preview/Icon */}
        {isImage && file.preview ? (
          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-zinc-900">
            <Image
              src={file.preview}
              alt={file.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-md bg-zinc-900 flex items-center justify-center">
            {isExcel ? (
              <FileSpreadsheet className="h-8 w-8 text-green-500" />
            ) : isPDF ? (
              <FileText className="h-8 w-8 text-red-500" />
            ) : (
              <ImageIcon className="h-8 w-8 text-blue-500" />
            )}
          </div>
        )}

        {/* File Info */}
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <p className="text-xs text-zinc-500">{formatSize(file.size)}</p>
          {file.metadata?.rows && (
            <p className="text-xs text-zinc-500">{file.metadata.rows} baris</p>
          )}
          {file.metadata?.pages && (
            <p className="text-xs text-zinc-500">{file.metadata.pages} halaman</p>
          )}
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 hover:bg-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}
