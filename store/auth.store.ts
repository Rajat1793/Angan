// Auth store scaffold: holds session/profile; wired to Supabase in Phase 1.
import { create } from 'zustand';

// Minimal profile shape; expanded when the schema lands.
export interface Profile {
  id: string;
  role: 'resident' | 'guard' | 'admin';
  society_id: string;
  full_name?: string;
  flat_id?: string | null;
}

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
