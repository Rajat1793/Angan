// Haptics: tiny wrappers so screens can add tactile feedback consistently.
// Respect the user's haptic-feedback toggle from settings.
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/store/settings.store';

const hapticsOn = () => useSettingsStore.getState().hapticsEnabled;

// Success buzz for confirmed actions (approve, pay, book).
export function hapticSuccess() {
  if (!hapticsOn()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

// Light tap for routine selections.
export function hapticTap() {
  if (!hapticsOn()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// Warning buzz for denials/errors.
export function hapticWarning() {
  if (!hapticsOn()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
