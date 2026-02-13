'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

function makeQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
      },
    },
  });

  if (typeof window !== 'undefined') {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
    });
    persistQueryClient({
      queryClient: qc,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  return qc;
}

export default function QueryProvider({ children }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
