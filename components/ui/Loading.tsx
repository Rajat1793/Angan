// Loading: centered spinner used as a screen/list placeholder.
import { ActivityIndicator, Text, View } from 'react-native';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background">
      <ActivityIndicator color="#3E481D" />
      <Text className="text-sm text-foreground/60">{label}</Text>
    </View>
  );
}
