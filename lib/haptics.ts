// Haptics: tiny wrappers so screens can add tactile feedback consistently.
import * as Haptics from 'expo-haptics';

// Success buzz for confirmed actions (approve, pay, book).
export function hapticSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

// Light tap for routine selections.
export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// Warning buzz for denials/errors.
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
