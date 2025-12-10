"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertCircle } from "lucide-react";
import { tableRowVariants } from "../animations/motion-variants";

interface BoardStation {
  id: string;
  stationCode: string;
  stationName?: string;
  sequence: number;
  manpower: number;
  cycleTime?: number;
  area?: string;
}

interface BoardStationsTableProps {
  boardId: string;
  boardType: string;
}

export function BoardStationsTable({ boardId, boardType }: BoardStationsTableProps) {
  const [stations, setStations] = useState<BoardStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/models/${boardId}/stations`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stations");
        }

        setStations(data.stations || []);
      } catch (err) {
        console.error("Error fetching stations:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (boardId) {
      fetchStations();
    }
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500 dark:text-slate-400">Loading stations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No stations found for this board.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white">
          Station List - {boardType}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {stations.length} stations
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
            <TableHead className="w-12 text-slate-500 dark:text-slate-400">#</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400">Station Code</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400">Station Name</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 text-center">Manpower</TableHead>
            <TableHead className="text-slate-500 dark:text-slate-400 text-center">Cycle Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((station, index) => (
            <motion.tr
              key={station.id}
              custom={index}
              variants={tableRowVariants}
              initial="hidden"
              animate="visible"
              className="border-slate-200 dark:border-slate-700"
            >
              <TableCell className="text-slate-400 font-mono text-sm">
                {station.sequence || index + 1}
              </TableCell>
              <TableCell className="font-mono text-slate-800 dark:text-white font-medium">
                {station.stationCode}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {station.stationName || "-"}
              </TableCell>
              <TableCell className="text-center text-slate-800 dark:text-white">
                {station.manpower}
              </TableCell>
              <TableCell className="text-center text-slate-500 dark:text-slate-400">
                {station.cycleTime ? `${station.cycleTime}s` : "-"}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
