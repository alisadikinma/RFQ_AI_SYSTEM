"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatMain } from "../main/ChatMain";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children?: React.ReactNode;
  chatId?: string;
}

/**
 * Legacy ChatLayout component - kept for backward compatibility.
 * New implementation uses the main Sidebar with integrated chat history.
 */
export function ChatLayout({ children, chatId }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[280px] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          currentChatId={currentChatId ?? null}
          onSelectChat={(id) => setCurrentChatId(id)}
          onNewChat={() => setCurrentChatId(undefined)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatMain chatId={currentChatId} />
      </main>
    </div>
  );
}
