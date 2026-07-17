// Badge: small status pill mapping visitor/ticket states to tones.
import { Text, View } from 'react-native';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

// Separate background and text classes so the label stays legible.
const bg: Record<Tone, string> = {
  neutral: 'bg-muted/15',
  success: 'bg-green-600/15',
  warning: 'bg-amber-500/20',
  danger: 'bg-red-600/15',
  info: 'bg-blue-600/15',
};
const fg: Record<Tone, string> = {
  neutral: 'text-foreground/70',
  success: 'text-green-700',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  info: 'text-blue-700',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg[tone]}`}>
      <Text className={`text-xs font-semibold capitalize ${fg[tone]}`}>{label}</Text>
    </View>
  );
}
