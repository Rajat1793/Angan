// Resident profile tab: shows identity and provides sign-out + theme toggle.
import { Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/store/theme.store';

export default function Profile() {
  const { profile, signOut } = useAuth();
  const setScheme = useThemeStore((s) => s.setScheme);
  const scheme = useThemeStore((s) => s.scheme);

  // Cycle light → dark → system so the toggle covers every mode.
  const nextScheme = () =>
    setScheme(scheme === 'light' ? 'dark' : scheme === 'dark' ? 'system' : 'light');

  return (
    <ScreenScaffold title="Profile">
      <View className="gap-5 p-5">
        <View className="gap-1">
          <Text className="text-lg font-semibold text-foreground">
            {profile?.full_name ?? 'Resident'}
          </Text>
          <Text className="text-sm capitalize text-foreground/60">
            {profile?.role}
          </Text>
        </View>
        <Button label={`Theme: ${scheme}`} variant="outline" onPress={nextScheme} />
        <Button label="Sign out" variant="ghost" onPress={signOut} />
      </View>
    </ScreenScaffold>
  );
}
