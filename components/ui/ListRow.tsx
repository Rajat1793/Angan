// ListRow: an icon + title + subtitle row with an optional badge or chevron.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

interface ListRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  badge?: string | number;
  onPress?: () => void;
  showChevron?: boolean;
}

export function ListRow({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  showChevron = true,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-muted/10 bg-background p-3 active:opacity-70"
    >
      {/* Circular tinted icon badge. */}
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={18} color="#3E481D" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-xs text-foreground/50">{subtitle}</Text> : null}
      </View>
      {badge != null ? (
        <View className="h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5">
          <Text className="text-xs font-bold text-white">{badge}</Text>
        </View>
      ) : null}
      {showChevron ? <Ionicons name="chevron-forward" size={18} color="#9ca3af" /> : null}
    </Pressable>
  );
}
