// Admin tabs: Dashboard · Residents · Complaints · Notices · Settings.
import { Tabs } from 'expo-router';

import { tabIcon } from '@/components/shared/tabIcon';
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon('grid'),
        }}
      />
      <Tabs.Screen
        name="residents"
        options={{
          title: 'Residents',
          tabBarIcon: tabIcon('people'),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'Complaints',
          tabBarIcon: tabIcon('chatbox-ellipses'),
        }}
      />
      <Tabs.Screen
        name="notices"
        options={{
          title: 'Notices',
          tabBarIcon: tabIcon('megaphone'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('settings'),
        }}
      />
      {/* Ticket detail opened from Complaints, not shown as a tab. */}
      <Tabs.Screen name="ticket/[id]" options={{ href: null }} />
      {/* Events + documents management opened from the dashboard. */}
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="moves" options={{ href: null }} />
    </Tabs>
  );
}
