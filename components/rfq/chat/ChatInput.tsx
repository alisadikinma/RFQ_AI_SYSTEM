'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Paperclip,
  Plus,
  Send,
  X,
  FileSpreadsheet,
  FileText,
  Image,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatInputProps {
  onSubmit: (input: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle paste (Excel data or files)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    // Check for files in clipboard
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length) {
      setFiles((prev) => [...prev, ...pastedFiles]);
    }
    // Let text paste through normally for Excel detection
  }, []);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  };

  // Handle submit
  const handleSubmit = () => {
    if (!input.trim() && files.length === 0) return;

    onSubmit(input, files.length > 0 ? files : undefined);
    setInput('');
    setFiles([]);
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Get file icon
  const getFileIcon = (file: File) => {
    if (
      file.type.includes('spreadsheet') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv')
    ) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    if (
      file.type.startsWith('image/') ||
      /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name)
    ) {
      return <Image className="h-4 w-4 text-purple-600" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-2">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-background rounded border text-sm"
            >
              {getFileIcon(file)}
              <span className="max-w-32 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="relative flex items-end gap-2 p-2 border rounded-2xl bg-muted/30 focus-within:ring-2 focus-within:ring-primary/20">
        {/* Add Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled={disabled}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 mr-2" />
              Upload File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Upload Button */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp"
          multiple
          onChange={handleFileChange}
        />

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={1}
        />

        {/* Send Button */}
        <Button
          size="icon"
          className="shrink-0 rounded-full"
          onClick={handleSubmit}
          disabled={disabled || (!input.trim() && files.length === 0)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
