"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function NewChatButton() {
  const router = useRouter();

  const handleNewChat = () => {
    // Navigate to chat page without ID = new chat
    router.push("/chat");
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 bg-primary-600 hover:bg-primary-700 text-white border-0"
        onClick={handleNewChat}
      >
        <Plus className="h-4 w-4" />
        Chat Baru
      </Button>
    </motion.div>
  );
}
