// OTA updates: manual check/apply wrapper (auto-check on launch is native, via
// the app.json `updates.checkAutomatically: ON_LOAD`). expo-updates is loaded
// lazily and skipped entirely in dev so the dev client never touches it.

export type OtaResult = 'updated' | 'current' | 'unavailable';

// Check for a published OTA update and, if found, fetch + reload into it.
export async function checkForOtaUpdate(): Promise<OtaResult> {
  // Never run in dev builds / Expo Go (loads from Metro, not from OTA).
  if (__DEV__) return 'unavailable';
  try {
    const Updates = await import('expo-updates');
    if (!Updates.isEnabled) return 'unavailable';
    const res = await Updates.checkForUpdateAsync();
    if (!res.isAvailable) return 'current';
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return 'updated';
  } catch {
    return 'unavailable';
  }
}
