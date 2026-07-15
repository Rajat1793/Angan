// useNotifications: on login, register for push and store the token; handle taps.
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { registerForPush, savePushToken } from '@/lib/notifications';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationsStore } from '@/store/notifications.store';

export function useNotifications() {
  const userId = useAuthStore((s) => s.profile?.id ?? null);
  const setToken = useNotificationsStore((s) => s.setToken);

  useEffect(() => {
    if (!userId) return;
    // Register + persist token once we know who is signed in.
    (async () => {
      const token = await registerForPush();
      if (token) {
        setToken(token);
        try {
          await savePushToken(userId, token);
        } catch {
          // Non-fatal: push simply won't target this device.
        }
      }
    })();

    // Tapping a visitor notification deep-links to the approvals screen.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { screen?: string };
      if (data?.screen === 'approvals') router.push('/(resident)/approvals');
    });
    return () => sub.remove();
  }, [userId, setToken]);
}
