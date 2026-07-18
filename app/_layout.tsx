// Root navigation layout: global styles, gesture root, and bottom-sheet host.
import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Loading, ToastHost } from '@/components/ui';
import { ConfigNotice } from '@/components/shared/ConfigNotice';
import { ConnectivityBanner } from '@/components/shared/ConnectivityBanner';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { isSupabaseConfigured } from '@/lib/supabase';
import { queryClient } from '@/lib/query';

// Redirects users to the correct group based on session + profile role.
function AuthGate() {
  const { session, profile, hydrating } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Register for push once a profile is available.
  useNotifications();

  useEffect(() => {
    if (hydrating) return;
    const group = segments[0];
    const inAuth = group === '(auth)';
    // Signed out → force auth group.
    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    // Signed in but profile incomplete → onboarding.
    if (profile && !profile.full_name) {
      if (group !== '(auth)') router.replace('/(auth)/onboarding');
      return;
    }
    // Signed in with a complete profile → ensure we're in the right role group.
    // Covers cold boot from the root index as well as post-login from (auth).
    if (profile) {
      const target =
        profile.role === 'guard'
          ? '(guard)'
          : profile.role === 'admin'
            ? '(admin)'
            : '(resident)';
      if (group !== target) router.replace(`/${target}`);
    }
  }, [session, profile, hydrating, segments, router]);

  if (hydrating) return <Loading label="Starting Angan…" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="(guard)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Providers wrap every route group; gesture root is required by bottom-sheet.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar style="auto" />
            <ConnectivityBanner />
            {isSupabaseConfigured ? <AuthGate /> : <ConfigNotice />}
            <ToastHost />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
