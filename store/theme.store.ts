// Theme store: tracks user override (light/dark/system) persisted per device.
import { create } from 'zustand';

type Scheme = 'light' | 'dark' | 'system';

interface ThemeState {
  scheme: Scheme;
  setScheme: (scheme: Scheme) => void;
}

// Default follows the OS; explicit choice overrides it in useTheme.
export const useThemeStore = create<ThemeState>((set) => ({
  scheme: 'system',
  setScheme: (scheme) => set({ scheme }),
}));
