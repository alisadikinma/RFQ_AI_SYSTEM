'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileSpreadsheet, FileText, X } from 'lucide-react';
import type { UploadedFile } from './types';

interface FilePreviewProps {
  files: UploadedFile[];
  onRemove?: (index: number) => void;
  processing?: boolean;
}

export function FilePreview({ files, onRemove, processing }: FilePreviewProps) {
  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon
  const getFileIcon = (file: UploadedFile) => {
    if (
      file.type.includes('spreadsheet') ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv')
    ) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
    }
    if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
      return <FileText className="h-6 w-6 text-red-600" />;
    }
    return <FileText className="h-6 w-6 text-blue-600" />;
  };

  // Get file type label
  const getFileType = (file: UploadedFile) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return 'Excel file';
    }
    if (file.name.endsWith('.csv')) {
      return 'CSV file';
    }
    if (file.name.endsWith('.pdf')) {
      return 'PDF file';
    }
    return 'File';
  };

  if (files.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {files.map((file, index) => (
        <Card key={index} className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getFileType(file)} • {formatSize(file.size)}
                </p>
              </div>
              {onRemove && !processing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => onRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {processing && (
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
