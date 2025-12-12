import { Loader2 } from 'lucide-react';

export default function ChatLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading chat...</p>
      </div>
    </div>
  );
}
