"use client";

import { useState } from "react";
import { ChatSession } from "@/hooks/useChatHistory";
import { MessageSquare, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ChatHistoryItemProps {
  chat: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ChatHistoryItem({ chat, isActive, onClick, onDelete }: ChatHistoryItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
        )}
        onClick={onClick}
      >
        {/* Delete Button - LEFT SIDE */}
        <button
          type="button"
          className="flex-shrink-0 p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-900/30"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
          title="Hapus"
        >
          <X className="h-4 w-4" />
        </button>

        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        
        <span className="flex-1 text-sm truncate">
          {chat.title}
        </span>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Hapus Chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Chat ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              disabled={isDeleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
