"use client";

import { useState } from "react";
import { ChatSession } from "@/hooks/useChatHistory";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
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

interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onDelete: () => void;
}

export function ChatHistoryItem({ session, isActive, onDelete }: ChatHistoryItemProps) {
  const router = useRouter();
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
          "flex items-center gap-2 pl-2 pr-1 py-2 rounded-lg cursor-pointer transition-colors",
          isActive
            ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        onClick={() => router.push(`/chat/${session.id}`)}
      >
        <MessageSquare className="h-4 w-4 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{session.title}</p>
          {session.preview && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session.preview}</p>
          )}
        </div>

        {/* Delete Button - RIGHT SIDE */}
        <button
          type="button"
          className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
          title="Hapus chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Chat ini akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
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
