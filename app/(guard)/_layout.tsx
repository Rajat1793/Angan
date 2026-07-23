// Guard tabs: Gate · Visitors · History · Alerts (register is a hidden route).
import { Tabs } from 'expo-router';

import { tabIcon } from '@/components/shared/tabIcon';
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gate',
          tabBarIcon: tabIcon('shield-checkmark'),
        }}
      />
      <Tabs.Screen
        name="visitors"
        options={{
          title: 'Visitors',
          tabBarIcon: tabIcon('people'),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: tabIcon('time'),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: tabIcon('notifications'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('settings'),
        }}
      />
      {/* Register + verify are opened from actions, not shown as tabs. */}
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="verify" options={{ href: null }} />
      {/* Attendance + deliveries opened from the Gate dashboard. */}
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="deliveries" options={{ href: null }} />
    </Tabs>
  );
}
