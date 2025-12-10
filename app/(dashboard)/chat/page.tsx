import { ChatMain } from "@/components/rfq/chat-v2";

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-5rem)] -m-6 flex flex-col bg-white dark:bg-slate-900">
      <ChatMain />
    </div>
  );
}
