// Auth store: holds Supabase session + profile and hydration state.
import { create } from 'zustand';

import type { Profile } from '@/lib/database.types';

interface AuthState {
  session: unknown | null;
  profile: Profile | null;
  hydrating: boolean;
  setSession: (session: unknown | null) => void;
  setProfile: (profile: Profile | null) => void;
  setHydrating: (hydrating: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  hydrating: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setHydrating: (hydrating) => set({ hydrating }),
  reset: () => set({ session: null, profile: null }),
}));
