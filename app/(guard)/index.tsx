// Guard gate: live queue placeholder + Register FAB (queue wired in Phase 3).
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function GuardGate() {
  return (
    <ScreenScaffold title="Gate">
      <Empty title="Queue is clear" hint="Register a visitor to start the flow." />
      {/* Floating action button opens the registration route. */}
      <Pressable
        onPress={() => router.push('/(guard)/register')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        <Text className="text-2xl font-bold text-background">+</Text>
      </Pressable>
    </ScreenScaffold>
  );
}
