// Resident home: quick greeting; live widgets are added in later phases.
import { Text, View } from 'react-native';

import { Card } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';

export default function ResidentHome() {
  const { profile } = useAuth();
  return (
    <ScreenScaffold title="Home">
      <View className="gap-4 p-5">
        <Text className="text-base text-foreground/70">
          Welcome back, {profile?.full_name ?? 'neighbour'}.
        </Text>
        <Card>
          <Text className="text-sm text-foreground/60">
            Approvals, notices, and dues at a glance — coming online across the app.
          </Text>
        </Card>
      </View>
    </ScreenScaffold>
  );
}
