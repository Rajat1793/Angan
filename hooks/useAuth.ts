// useAuth: hydrates the Supabase session, loads the profile, exposes sign-out.
import { useEffect } from 'react';

import { fetchProfile, signOut as authSignOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const { session, profile, hydrating, setSession, setProfile, setHydrating, reset } =
    useAuthStore();

  useEffect(() => {
    // Load any persisted session on mount, then fetch the profile.
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        try {
          setProfile(await fetchProfile(data.session.user.id));
        } catch {
          setProfile(null);
        }
      }
      setHydrating(false);
    })();

    // Keep store in sync with future auth changes (login/logout/refresh).
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) {
        try {
          setProfile(await fetchProfile(next.user.id));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setSession, setProfile, setHydrating]);

  // Sign out both remotely and locally.
  const signOut = async () => {
    await authSignOut();
    reset();
  };

  return { session, profile, hydrating, signOut };
}
