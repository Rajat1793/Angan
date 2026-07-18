// useOfflineSync: watch connectivity and flush queued visitor inserts in order.
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/ui';
import { createVisitor } from '@/lib/visitors';
import { useOfflineStore } from '@/store/offline.store';

export function useOfflineSync() {
  const [online, setOnline] = useState(true);
  const queue = useOfflineStore((s) => s.queue);
  const dequeue = useOfflineStore((s) => s.dequeue);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);

  // Track connectivity transitions from NetInfo.
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return () => unsub();
  }, []);

  // When back online with a non-empty queue, replay inserts in FIFO order.
  useEffect(() => {
    if (!online || queue.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const item of [...queue]) {
        if (cancelled) break;
        try {
          await createVisitor(
            {
              ...item.input,
              society_id: item.societyId,
            },
            item.createdBy,
          );
          dequeue(item.localId);
        } catch {
          // Stop on first failure; remaining items retry on next reconnect.
          break;
        }
      }
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      if (!cancelled) toast('Offline queue synced', 'success');
    })();
    return () => {
      cancelled = true;
    };
  }, [online, queue, dequeue, queryClient, toast]);

  return { online, pending: queue.length };
}
