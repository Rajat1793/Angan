// Resident profile tab: identity + settings (sound/haptics/theme) and sign-out.
import { Text, View } from 'react-native';

import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { SettingsPanel } from '@/components/shared/SettingsPanel';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { profile } = useAuth();

  return (
    <ScreenScaffold title="Profile">
      <View className="gap-1 px-5 pt-5">
        <Text className="text-lg font-semibold text-foreground">
          {profile?.full_name ?? 'Resident'}
        </Text>
        <Text className="text-sm capitalize text-foreground/60">{profile?.role}</Text>
      </View>
      <SettingsPanel />
    </ScreenScaffold>
  );
}
