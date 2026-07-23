// FAB: an extended floating action button for a screen's primary action.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color?: string;
  onPress?: () => void;
}

export function FAB({ icon, label, color = '#3E481D', onPress }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? 'Action'}
      className="absolute bottom-6 right-5 flex-row items-center gap-2 rounded-full px-5 py-4 shadow-lg active:scale-95 active:opacity-90"
      style={{ backgroundColor: color, elevation: 6 }}
    >
      <Ionicons name={icon} size={22} color="#fff" />
      {label ? <Text className="text-base font-semibold text-white">{label}</Text> : null}
    </Pressable>
  );
}
