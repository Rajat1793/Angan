// Empty: friendly empty-state with title, hint, and optional action.
import { Text, View } from 'react-native';

import { Button } from './Button';

interface EmptyProps {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Empty({ title, hint, actionLabel, onAction }: EmptyProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background p-6">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {hint ? (
        <Text className="text-center text-sm text-foreground/60">{hint}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <Button label={actionLabel} variant="outline" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
