// Root navigation layout: global styles, gesture root, and bottom-sheet host.
import '../global.css';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Loading, SuccessHost, ToastHost } from '@/components/ui';
import { ConfigNotice } from '@/components/shared/ConfigNotice';
import { ConnectivityBanner } from '@/components/shared/ConnectivityBanner';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { isSupabaseConfigured } from '@/lib/supabase';
import { queryClient } from '@/lib/query';
import { useSettingsStore } from '@/store/settings.store';
import { useThemeStore } from '@/store/theme.store';

// Redirects users to the correct group based on session + profile role.
function AuthGate() {
  const { session, profile, hydrating } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const introSeen = useSettingsStore((s) => s.introSeen);

  // Register for push once a profile is available.
  useNotifications();

  useEffect(() => {
    if (hydrating) return;
    const group = segments[0];
    const inAuth = group === '(auth)';
    const onIntro = (segments[1] as string) === 'intro';
    // Signed out → onboarding intro on first run, otherwise the login screen.
    if (!session) {
      if (!introSeen) {
        if (!onIntro) router.replace('/(auth)/intro' as never);
        return;
      }
      if (!inAuth || onIntro) router.replace('/(auth)/login');
      return;
    }
    // Signed in but profile incomplete → onboarding.
    if (profile && !profile.full_name) {
      if (group !== '(auth)') router.replace('/(auth)/onboarding');
      return;
    }
    // Signed in with a complete profile → ensure we're in the right role group.
    // Only redirect from the root index or the (auth) group so shared routes
    // (e.g. /notifications) opened on top of a role group are left alone.
    if (profile) {
      const target =
        profile.role === 'guard'
          ? '(guard)'
          : profile.role === 'admin'
            ? '(admin)'
            : '(resident)';
      if (group === undefined || group === '(auth)') router.replace(`/${target}`);
    }
  }, [session, profile, hydrating, segments, router, introSeen]);

  if (hydrating) return <Loading label="Starting Angan…" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(resident)" />
      <Stack.Screen name="(guard)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen
        name="notifications"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  // Keep NativeWind's color scheme in sync with the user's theme choice so
  // every `className` token (bg-background, text-foreground, …) switches too.
  const scheme = useThemeStore((s) => s.scheme);
  const { colorScheme, setColorScheme } = useNativewindColorScheme();
  useEffect(() => {
    setColorScheme(scheme);
  }, [scheme, setColorScheme]);

  // Providers wrap every route group; gesture root is required by bottom-sheet.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <ConnectivityBanner />
            {isSupabaseConfigured ? <AuthGate /> : <ConfigNotice />}
            <ToastHost />
            <SuccessHost />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
