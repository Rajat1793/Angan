// useRealtime: subscribe to a society-scoped Postgres changes channel.
import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';

// Invalidate/refetch callback fires on any change to the given table.
export function useRealtime(
  table: string,
  societyId: string | null | undefined,
  onChange: () => void,
) {
  // Unique per hook instance so multiple lists never collide on channel names.
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  useEffect(() => {
    if (!societyId) return;
    const channel = supabase
      .channel(`${table}:${societyId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `society_id=eq.${societyId}`,
        },
        onChange,
      )
      .subscribe();

    // Always clean up the channel to avoid leaks on unmount.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, societyId, onChange, instanceId]);
}
