"use client";

import { Upload } from "lucide-react";
import { motion } from "framer-motion";

interface FileDropzoneProps {
  onDrop: (e: React.DragEvent) => void;
  onDragLeave: () => void;
}

export function FileDropzone({ onDrop, onDragLeave }: FileDropzoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm rounded-xl border-2 border-dashed border-blue-500"
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Upload className="h-12 w-12 text-blue-400 mx-auto mb-2" />
        </motion.div>
        <p className="text-lg font-medium text-white">Drop file di sini</p>
        <p className="text-sm text-zinc-400">Image, Excel, atau PDF</p>
      </div>
    </motion.div>
  );
}
