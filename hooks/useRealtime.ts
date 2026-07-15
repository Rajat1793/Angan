// useRealtime: subscribe to a society-scoped Postgres changes channel.
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

// Invalidate/refetch callback fires on any change to the given table.
export function useRealtime(
  table: string,
  societyId: string | null | undefined,
  onChange: () => void,
) {
  useEffect(() => {
    if (!societyId) return;
    const channel = supabase
      .channel(`${table}:${societyId}`)
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
  }, [table, societyId, onChange]);
}
