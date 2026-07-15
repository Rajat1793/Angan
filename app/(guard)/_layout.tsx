// Guard tabs: Gate · Visitors · History · Alerts (register is a hidden route).
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export default function GuardLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Gate' }} />
      <Tabs.Screen name="visitors" options={{ title: 'Visitors' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      {/* Register + verify are opened from actions, not shown as tabs. */}
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="verify" options={{ href: null }} />
    </Tabs>
  );
}
