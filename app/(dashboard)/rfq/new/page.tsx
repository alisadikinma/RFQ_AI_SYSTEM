'use client';

import { PageTransition } from '@/components/layout/PageTransition';
import { RfqChatInterface } from '@/components/rfq/chat';

export default function NewRFQPage() {
  return (
    <PageTransition>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            New RFQ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Create a new RFQ request with AI-powered station mapping
          </p>
        </div>

        <RfqChatInterface />
      </div>
    </PageTransition>
  );
}
