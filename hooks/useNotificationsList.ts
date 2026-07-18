// useNotificationsList: bell feed + unread count with realtime invalidation.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { listNotifications } from '@/lib/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useRealtime } from './useRealtime';

export function useNotificationsList() {
  const societyId = useAuthStore((s) => s.profile?.society_id ?? null);
  const profileId = useAuthStore((s) => s.profile?.id ?? null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    enabled: !!profileId,
  });

  // Any new/updated notification row refetches the feed (RLS scopes to the user).
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);
  useRealtime('notifications', societyId, invalidate);

  const unread = (query.data ?? []).filter((n) => !n.read).length;
  return { ...query, unread };
}
