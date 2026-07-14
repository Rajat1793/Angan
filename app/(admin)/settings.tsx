// Admin settings tab: society settings + sign-out and theme toggle.
import { Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/theme.store';

export default function AdminSettings() {
  const { profile, signOut } = useAuth();
  const setScheme = useThemeStore((s) => s.setScheme);
  const scheme = useThemeStore((s) => s.scheme);

  // Cycle light → dark → system for parity with the resident profile.
  const nextScheme = () =>
    setScheme(scheme === 'light' ? 'dark' : scheme === 'dark' ? 'system' : 'light');

  return (
    <ScreenScaffold title="Settings">
      <View className="gap-5 p-5">
        <Text className="text-sm text-foreground/60">
          Signed in as {profile?.full_name ?? 'Admin'}
        </Text>
        <Button label={`Theme: ${scheme}`} variant="outline" onPress={nextScheme} />
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenScaffold>
  );
}
