import { ChatMain } from "@/components/rfq/chat-v2";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="h-[calc(100vh-5rem)] -m-6 flex flex-col bg-white dark:bg-slate-900">
      <ChatMain chatId={id} />
    </div>
  );
}
