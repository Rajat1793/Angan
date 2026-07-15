// Resident tabs: Home · Approvals · Community · Payments · Profile.
import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

export default function ResidentLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approvals' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="payments" options={{ title: 'Payments' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Pre-approval is opened from Approvals, not shown as a tab. */}
      <Tabs.Screen name="preapprove" options={{ href: null }} />
    </Tabs>
  );
}
