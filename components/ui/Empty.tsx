// Empty: friendly empty-state with an illustrated icon, title, hint, and action.
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ACCENTS, tint } from '@/lib/accents';
import { Button } from './Button';

interface EmptyProps {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function Empty({
  title,
  hint,
  icon = 'file-tray-outline',
  actionLabel,
  onAction,
}: EmptyProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background p-6">
      <View
        className="h-20 w-20 items-center justify-center rounded-full"
        style={{ backgroundColor: tint(ACCENTS.slate) }}
      >
        <Ionicons name={icon} size={36} color={ACCENTS.slate} />
      </View>
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
