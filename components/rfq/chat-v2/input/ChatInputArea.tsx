"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { FilePreview, UploadedFile } from "./FilePreview";
import { FileDropzone } from "./FileDropzone";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChatInputAreaProps {
  onSendMessage: (content: string, files?: File[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInputArea({ onSendMessage, isLoading, disabled, placeholder }: ChatInputAreaProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle paste (images from clipboard)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await addFile(file);
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // Convert file to preview data
  const addFile = async (file: File) => {
    const id = crypto.randomUUID();
    let preview: string | undefined;
    let metadata: Record<string, any> = {};

    // Generate preview based on file type
    if (file.type.startsWith("image/")) {
      preview = await fileToDataURL(file);
    } else if (file.type.includes("spreadsheet") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      metadata.type = "excel";
      // Row count akan diisi setelah parsing
    } else if (file.type === "application/pdf") {
      metadata.type = "pdf";
      // Page count akan diisi setelah parsing
    }

    const uploadedFile: UploadedFile = {
      id,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview,
      metadata,
    };

    setFiles((prev) => [...prev, uploadedFile]);
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    for (const file of selectedFiles) {
      await addFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    for (const file of droppedFiles) {
      await addFile(file);
    }
  }, []);

  const handleSubmit = () => {
    if ((input.trim() || files.length > 0) && !isLoading) {
      const message = input.trim() || (files.length > 0 ? "Menganalisis file yang diupload..." : "");
      onSendMessage(message, files.map((f) => f.file));
      setInput("");
      setFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto">
        {/* Drag & Drop Overlay */}
        <AnimatePresence>
          {isDragging && (
            <FileDropzone
              onDrop={handleDrop}
              onDragLeave={() => setIsDragging(false)}
            />
          )}
        </AnimatePresence>

        {/* File Previews */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <FilePreview
                    key={file.id}
                    file={file}
                    onRemove={() => removeFile(file.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div
          className={cn(
            "relative rounded-xl border transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
              : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Ketik pesan, paste gambar (Ctrl+V), atau drag & drop file..."}
            disabled={isLoading || disabled}
            className="min-h-[60px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 pr-24"
          />

          {/* Action Buttons */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* File Upload Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSubmit}
              disabled={(!input.trim() && files.length === 0) || isLoading}
              size="icon"
              className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.xlsx,.xls,.pdf"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Helper Text */}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
          Mendukung: Gambar, Excel (.xlsx), PDF | Paste gambar dengan Ctrl+V
        </p>
      </div>
    </div>
  );
}
