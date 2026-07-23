// Resident tabs: Home · Approvals · Community · Payments · Profile.
import { Tabs } from 'expo-router';

import { tabIcon } from '@/components/shared/tabIcon';
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home'),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: tabIcon('checkmark-done-circle'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: tabIcon('megaphone'),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: tabIcon('card'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person'),
        }}
      />
      {/* Pre-approval is opened from Approvals, not shown as a tab. */}
      <Tabs.Screen name="preapprove" options={{ href: null }} />
      {/* Helpdesk + ticket detail are opened from Community/Home. */}
      <Tabs.Screen name="helpdesk" options={{ href: null }} />
      <Tabs.Screen name="ticket/[id]" options={{ href: null }} />
      {/* Notice + post detail are opened from Community. */}
      <Tabs.Screen name="notice/[id]" options={{ href: null }} />
      <Tabs.Screen name="post/[id]" options={{ href: null }} />
      {/* Notices list + polls opened from Home. */}
      <Tabs.Screen name="notices" options={{ href: null }} />
      <Tabs.Screen name="polls" options={{ href: null }} />
      {/* Services hub + its screens, opened from Home. */}
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="sos" options={{ href: null }} />
      <Tabs.Screen name="frequent" options={{ href: null }} />
      <Tabs.Screen name="vehicles" options={{ href: null }} />
      <Tabs.Screen name="deliveries" options={{ href: null }} />
      <Tabs.Screen name="directory" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="events" options={{ href: null }} />
      <Tabs.Screen name="marketplace" options={{ href: null }} />
      <Tabs.Screen name="move" options={{ href: null }} />
      {/* Amenities booking opened from Home. */}
      <Tabs.Screen name="amenities" options={{ href: null }} />
    </Tabs>
  );
}
