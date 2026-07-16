// Offline store: persist failed visitor inserts and flush them on reconnect.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { VisitorInput } from '@/lib/validation';

// A queued registration keeps everything needed to retry the insert later.
export interface QueuedVisitor {
  localId: string;
  input: VisitorInput;
  societyId: string;
  flatId: string | null;
  createdBy: string;
  createdAt: number;
}

interface OfflineState {
  queue: QueuedVisitor[];
  enqueue: (item: QueuedVisitor) => void;
  dequeue: (localId: string) => void;
  clear: () => void;
}

// Persisted to AsyncStorage so the queue survives app restarts.
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
      dequeue: (localId) =>
        set((s) => ({ queue: s.queue.filter((q) => q.localId !== localId) })),
      clear: () => set({ queue: [] }),
    }),
    { name: 'angan-offline-queue', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
