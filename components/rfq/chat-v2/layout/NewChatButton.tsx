"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface NewChatButtonProps {
  onClick: () => void;
}

export function NewChatButton({ onClick }: NewChatButtonProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-white"
        onClick={onClick}
      >
        <Plus className="h-4 w-4" />
        Chat Baru
      </Button>
    </motion.div>
  );
}
