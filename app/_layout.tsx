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
import { useAuth } from '@/hooks/useAuth';
import { queryClient } from '@/lib/query';

// Redirects users to the correct group based on session + profile role.
function AuthGate() {
  const { session, profile, hydrating } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (hydrating) return;
    const inAuth = segments[0] === '(auth)';
    // Signed out → force auth group.
    if (!session) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    // Signed in but profile incomplete → onboarding.
    if (profile && !profile.full_name) {
      router.replace('/(auth)/onboarding');
      return;
    }
    // Route by role once the profile is loaded.
    if (profile && inAuth) {
      if (profile.role === 'guard') router.replace('/(guard)');
      else if (profile.role === 'admin') router.replace('/(admin)');
      else router.replace('/(resident)');
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
            <AuthGate />
            <ToastHost />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
