// Admin tabs: Dashboard · Residents · Complaints · Notices · Settings.
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export default function AdminLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="residents" options={{ title: 'Residents' }} />
      <Tabs.Screen name="complaints" options={{ title: 'Complaints' }} />
      <Tabs.Screen name="notices" options={{ title: 'Notices' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
