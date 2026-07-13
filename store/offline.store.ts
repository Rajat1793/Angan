// Offline store scaffold: queues failed visitor inserts; flushed in Phase 6.
import { create } from 'zustand';

export interface QueuedVisitor {
  localId: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

interface OfflineState {
  queue: QueuedVisitor[];
  enqueue: (item: QueuedVisitor) => void;
  dequeue: (localId: string) => void;
  clear: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  queue: [],
  enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
  dequeue: (localId) =>
    set((s) => ({ queue: s.queue.filter((q) => q.localId !== localId) })),
  clear: () => set({ queue: [] }),
}));
