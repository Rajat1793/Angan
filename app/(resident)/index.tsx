// Resident home: quick greeting + shortcuts to common actions.
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card } from '@/components/ui';
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
        <Card className="gap-3">
          <Text className="text-sm text-foreground/60">Quick actions</Text>
          <Button
            label="Book an amenity"
            onPress={() => router.push('/(resident)/amenities')}
          />
          <Button
            label="Pre-approve a guest"
            variant="outline"
            onPress={() => router.push('/(resident)/preapprove')}
          />
        </Card>
      </View>
    </ScreenScaffold>
  );
}
