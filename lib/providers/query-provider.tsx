'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data dianggap fresh selama 5 menit
            staleTime: 5 * 60 * 1000,
            // Cache disimpan selama 30 menit
            gcTime: 30 * 60 * 1000,
            // Jangan refetch saat window focus (mengurangi API calls)
            refetchOnWindowFocus: false,
            // Retry 1x jika error
            retry: 1,
            // Jangan refetch saat reconnect
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
