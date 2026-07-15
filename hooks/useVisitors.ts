// useVisitors: TanStack Query list keyed by status + realtime invalidation.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listVisitors } from '@/lib/visitors';
import type { VisitorStatus } from '@/lib/database.types';
import { useAuthStore } from '@/store/auth.store';
import { useRealtime } from './useRealtime';

export function useVisitors(statuses: VisitorStatus[]) {
  const societyId = useAuthStore((s) => s.profile?.society_id ?? null);
  const queryClient = useQueryClient();
  const key = ['visitors', statuses.join(',')];

  const query = useQuery({
    queryKey: key,
    queryFn: () => listVisitors(statuses),
    enabled: !!societyId,
  });

  // Any visitor change in the society refetches this bucket.
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['visitors'] });
  }, [queryClient]);
  useRealtime('visitors', societyId, invalidate);

  return query;
}
