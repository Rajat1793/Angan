// Notifications: request permission, fetch Expo push token, persist to profile.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { supabase } from './supabase';

// Expo Go (SDK 53+) dropped remote push; only dev/standalone builds support it.
export const isExpoGo = Constants.appOwnership === 'expo';

// Foreground alerts show a banner + play a sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
