// QuickAction: a compact square tile with an icon, label, and optional badge.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: string | number;
  onPress?: () => void;
}

export function QuickAction({ icon, label, badge, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center gap-2 rounded-2xl border border-muted/10 bg-background p-3 active:opacity-70"
    >
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={22} color="#3E481D" />
        {badge != null ? (
          <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1">
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-center text-xs font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}
