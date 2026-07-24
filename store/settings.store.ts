// Settings store: user toggles for notification sound + haptic feedback.
// Persisted to AsyncStorage so choices survive restarts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  introSeen: boolean;
  setSound: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setNotifications: (on: boolean) => void;
  setIntroSeen: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      notificationsEnabled: true,
      introSeen: false,
      setSound: (soundEnabled) => set({ soundEnabled }),
      setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
      setNotifications: (notificationsEnabled) => set({ notificationsEnabled }),
      setIntroSeen: (introSeen) => set({ introSeen }),
    }),
    { name: 'angan-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
