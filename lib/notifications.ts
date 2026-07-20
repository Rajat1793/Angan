// Notifications: request permission, fetch Expo push token, persist to profile.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';
import { useSettingsStore } from '@/store/settings.store';

// Expo Go (SDK 53+) dropped remote push; only dev/standalone builds support it.
export const isExpoGo = Constants.appOwnership === 'expo';

// A single in-app notification row (drives the bell list + unread badge).
export interface AppNotification {
  id: string;
  society_id: string;
  profile_id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

// Foreground alerts show a banner; sound follows the user's setting.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: useSettingsStore.getState().soundEnabled,
    shouldSetBadge: true,
  }),
});

// Android needs a high-importance channel for heads-up alerts with sound.
export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3E481D',
  });
}

// Register for push and return the Expo token (null on Expo Go/simulator/denied).
export async function registerForPush(): Promise<string | null> {
  // Skip in Expo Go where getExpoPushTokenAsync throws on Android.
  if (isExpoGo || !Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

// Save the device token so Edge Functions can target this user.
export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);
  if (error) throw error;
}

// Latest in-app notifications for the signed-in user (RLS scopes to them).
export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

// Mark every unread notification for the user as read.
export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) throw error;
}
