'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, CheckCircle2, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseUploadedFile } from '@/lib/utils/file-parser';

interface FileUploadStepProps {
  data: any;
  onChange: (data: any) => void;
}

export function FileUploadStep({ data, onChange }: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(data?.file || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(data?.parsedData || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onChange({ file: uploadedFile, parsedData });
  }, [uploadedFile, parsedData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    setError(null);

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/pdf',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv|pdf)$/i)) {
      setError('Invalid file type. Please upload Excel, CSV, or PDF files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    clearInterval(interval);
    setUploadProgress(100);
    setIsUploading(false);
    setUploadedFile(file);

    setIsParsing(true);
    const parsed = await parseUploadedFile(file);
    setIsParsing(false);
    setParsedData(parsed);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParsedData(null);
    setUploadProgress(0);
    setError(null);
  };

  const dropzoneVariants = {
    idle: { borderColor: '#e5e7eb', backgroundColor: 'transparent' },
    active: {
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      scale: 1.01,
    },
  };

  const checkmarkVariants = {
    initial: { pathLength: 0 },
    animate: {
      pathLength: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Upload Customer Document
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload an Excel, CSV, or PDF file containing station information
        </p>
      </div>

      {!uploadedFile ? (
        <motion.div
          variants={dropzoneVariants}
          animate={isDragging ? 'active' : 'idle'}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all"
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
              className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </motion.div>

            <div>
              <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                Drag & drop your file here
              </p>
              <p className="text-sm text-slate-500">or click to browse</p>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>Supported: .xlsx, .xls, .csv, .pdf</p>
              <p>Max size: 10MB</p>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      ) : (
        <div className="space-y-6">
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {uploadedFile.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  ) : isParsing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  ) : parsedData ? (
                    <motion.div
                      initial="initial"
                      animate="animate"
                      className="text-success"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.div>
                  ) : null}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isUploading && (
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {isParsing && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Analyzing document...
                    </p>
                    <p className="text-xs text-slate-500">
                      Extracting station information
                    </p>
                  </div>
                </div>
              </div>
            )}

            {parsedData && !isParsing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-t border-slate-200 dark:border-slate-700"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      Extracted Data Preview
                    </h4>
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Found {parsedData.totalStations} stations across{' '}
                    {parsedData.boardTypes.length} board types:
                  </p>

                  <div className="space-y-3">
                    {parsedData.boardTypes.map((boardType: string) => {
                      const boardStations = parsedData.stations.filter(
                        (s: any) => s.boardType === boardType
                      );

                      return (
                        <div
                          key={boardType}
                          className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {boardType}
                            </span>
                            <Badge variant="secondary">
                              {boardStations.length} stations
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {boardStations.map((station: any, idx: number) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="gap-1"
                              >
                                {station.original}
                                {station.original !== station.mapped && (
                                  <>
                                    <span className="text-slate-400">→</span>
                                    {station.mapped}
                                  </>
                                )}
                                <CheckCircle2 className="w-3 h-3 text-success" />
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {parsedData && (
            <div className="flex justify-end">
              <Button
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
              >
                Confirm & Continue
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
