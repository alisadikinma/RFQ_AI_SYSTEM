"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Search,
  Edit2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tableRowVariants, fadeInUp } from "../animations/motion-variants";

export interface ExtractedStation {
  id: string;
  code: string;
  name?: string;
  section?: string;
  sequence: number;
  isValid: boolean;
  suggestedCode?: string;
  confidence?: number;
}

interface ExtractedDataTableProps {
  stations: ExtractedStation[];
  onStationsChange: (stations: ExtractedStation[]) => void;
  onFindSimilar: (stations: ExtractedStation[]) => void;
  isEditing?: boolean;
}

export function ExtractedDataTable({
  stations,
  onStationsChange,
  onFindSimilar,
  isEditing: initialEditing = false,
}: ExtractedDataTableProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [editedStations, setEditedStations] = useState(stations);

  const validCount = editedStations.filter((s) => s.isValid).length;
  const invalidCount = editedStations.filter((s) => !s.isValid).length;

  const handleCodeChange = (id: string, newCode: string) => {
    setEditedStations((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, code: newCode, isValid: true, suggestedCode: undefined }
          : s
      )
    );
  };

  const handleDelete = (id: string) => {
    setEditedStations((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAdd = () => {
    const newStation: ExtractedStation = {
      id: crypto.randomUUID(),
      code: "",
      sequence: editedStations.length + 1,
      isValid: false,
    };
    setEditedStations((prev) => [...prev, newStation]);
  };

  const handleSave = () => {
    onStationsChange(editedStations);
    setIsEditing(false);
  };

  const handleUseSuggestion = (id: string, suggestedCode: string) => {
    setEditedStations((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, code: suggestedCode, isValid: true, suggestedCode: undefined }
          : s
      )
    );
  };

  const getStatusIcon = (station: ExtractedStation) => {
    if (station.isValid) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (station.suggestedCode) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <X className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (station: ExtractedStation) => {
    if (station.isValid) return "Valid";
    if (station.suggestedCode) return `→ ${station.suggestedCode}`;
    return "Tidak ditemukan";
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Extracted Stations ({editedStations.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="text-green-500">{validCount} valid</span>
              {invalidCount > 0 && (
                <span className="text-yellow-500 ml-2">
                  {invalidCount} perlu review
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-1" /> Simpan
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </>
          )}
        </Button>
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
              <TableHead className="w-12 text-slate-500 dark:text-slate-400">#</TableHead>
              <TableHead className="text-slate-500 dark:text-slate-400">Station Code</TableHead>
              <TableHead className="text-slate-500 dark:text-slate-400">Section</TableHead>
              <TableHead className="w-40 text-slate-500 dark:text-slate-400">Status</TableHead>
              {isEditing && (
                <TableHead className="w-12 text-slate-500 dark:text-slate-400"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {editedStations.map((station, index) => (
                <motion.tr
                  key={station.id}
                  custom={index}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "border-slate-200 dark:border-slate-700",
                    index % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/30" : "bg-transparent",
                    !station.isValid && "bg-yellow-500/5"
                  )}
                >
                  <TableCell className="text-slate-500 dark:text-slate-400 font-mono">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={station.code}
                        onChange={(e) =>
                          handleCodeChange(station.id, e.target.value)
                        }
                        className="h-8 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white"
                      />
                    ) : (
                      <span className="font-mono text-slate-800 dark:text-white font-medium">
                        {station.code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400">
                    {station.section || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(station)}
                      <span
                        className={cn(
                          "text-sm",
                          station.isValid
                            ? "text-green-500"
                            : station.suggestedCode
                            ? "text-yellow-500"
                            : "text-red-500"
                        )}
                      >
                        {getStatusText(station)}
                      </span>
                      {station.suggestedCode && !station.isValid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() =>
                            handleUseSuggestion(station.id, station.suggestedCode!)
                          }
                        >
                          Gunakan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {isEditing && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(station.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        {isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Tambah Station
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={() => onFindSimilar(editedStations)}
          disabled={validCount === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Search className="h-4 w-4 mr-2" />
          Cari Model Serupa
        </Button>
      </div>
    </motion.div>
  );
}
