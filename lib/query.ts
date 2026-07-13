// TanStack Query client: sensible retry/staleness defaults for a mobile app.
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Avoid noisy refetches; realtime pushes keep data fresh instead.
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});
