// Settings store: user toggles for notification sound + haptic feedback.
// Persisted to AsyncStorage so choices survive restarts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  setSound: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setNotifications: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      notificationsEnabled: true,
      setSound: (soundEnabled) => set({ soundEnabled }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
      setNotifications: (notificationsEnabled) => set({ notificationsEnabled }),
    }),
    { name: 'angan-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
