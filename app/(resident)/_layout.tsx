// Resident tabs: Home · Approvals · Community · Payments · Profile.
import { Ionicons } from '@expo/vector-icons';
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
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
      {/* Amenities booking opened from Home. */}
      <Tabs.Screen name="amenities" options={{ href: null }} />
    </Tabs>
  );
}
