// SectionHeader: a titled row with an optional right-aligned action link.
import { Pressable, Text, View } from 'react-native';

import { Typo } from './Typo';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Typo variant="heading">{title}</Typo>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
