// SettingsPanel: shared controls reused by resident/guard/admin settings.
// Sound + haptic knobs, theme cycle, OTA update check, and sign out.
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Button, useToast } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { checkForOtaUpdate } from '@/lib/updates';
import { useSettingsStore } from '@/store/settings.store';
import { useThemeStore } from '@/store/theme.store';

// A labelled on/off knob row.
function ToggleRow({
  icon,
  label,
  hint,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-muted/10 bg-background p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={18} color="#3E481D" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {hint ? <Text className="text-xs text-foreground/50">{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#3E481D' }}
        thumbColor="#FCFDF3"
      />
    </View>
  );
}

export function SettingsPanel() {
  const { profile, signOut } = useAuth();
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setSound = useSettingsStore((s) => s.setSound);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const setNotifications = useSettingsStore((s) => s.setNotifications);
  const scheme = useThemeStore((s) => s.scheme);
  const setScheme = useThemeStore((s) => s.setScheme);
  const toast = useToast((s) => s.show);
  const [checking, setChecking] = useState(false);

  // Cycle light → dark → system.
  const nextScheme = () =>
    setScheme(scheme === 'light' ? 'dark' : scheme === 'dark' ? 'system' : 'light');

  const checkUpdates = async () => {
    setChecking(true);
    const res = await checkForOtaUpdate();
    setChecking(false);
    if (res === 'current') toast("You're on the latest version", 'success');
    else if (res === 'unavailable') toast('This build can’t receive OTA updates', 'info');
    // 'updated' reloads the app automatically.
  };

  return (
    <View className="gap-5 p-5">
      <View className="gap-3">
        <ToggleRow
          icon="notifications"
          label="Push notifications"
          hint="Show alerts for society activity"
          value={notificationsEnabled}
          onValueChange={setNotifications}
        />
        <ToggleRow
          icon="volume-high"
          label="Notification sound"
          hint="Play a sound for new alerts"
          value={soundEnabled}
          onValueChange={setSound}
        />
        <ToggleRow
          icon="phone-portrait"
          label="Haptic feedback"
          hint="Vibrate on actions"
          value={hapticsEnabled}
          onValueChange={setHaptics}
        />
      </View>

      <View className="gap-3">
        <Button label={`Theme: ${scheme}`} variant="outline" onPress={nextScheme} />
        <Button
          label="Check for updates"
          variant="outline"
          loading={checking}
          onPress={checkUpdates}
        />
      </View>

      <View className="gap-1">
        <Text className="text-xs text-foreground/40">
          Signed in as {profile?.full_name ?? profile?.role ?? 'user'}
        </Text>
        <Text className="text-xs text-foreground/40">
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </View>

      <Button label="Sign out" variant="ghost" onPress={signOut} />
    </View>
  );
}
