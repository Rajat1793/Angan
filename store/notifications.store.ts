// Notifications store scaffold: tracks push token + unread count.
import { create } from 'zustand';

interface NotificationsState {
  expoPushToken: string | null;
  unread: number;
  setToken: (token: string | null) => void;
  setUnread: (unread: number) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  expoPushToken: null,
  unread: 0,
  setToken: (expoPushToken) => set({ expoPushToken }),
  setUnread: (unread) => set({ unread }),
}));
