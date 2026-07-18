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
      try {
        // Race getSession against a timeout so a stalled call never blocks boot.
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 8000),
          ),
        ]);
        if (!active) return;
        const session = result.data.session;
        setSession(session);
        if (session?.user) {
          try {
            setProfile(await fetchProfile(session.user.id));
          } catch {
            setProfile(null);
          }
        }
      } catch {
        // Treat any hydration failure as signed-out rather than hanging.
        if (active) setSession(null);
      } finally {
        // Always finish hydration so the app can route to a screen.
        if (active) setHydrating(false);
      }
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
