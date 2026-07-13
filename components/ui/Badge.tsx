// Badge: small status pill mapping visitor/ticket states to tones.
import { Text, View } from 'react-native';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-muted/10 text-foreground',
  success: 'bg-green-600/15 text-green-700',
  warning: 'bg-amber-500/15 text-amber-700',
  danger: 'bg-red-600/15 text-red-700',
  info: 'bg-blue-600/15 text-blue-700',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${tones[tone]}`}>
      <Text className={`text-xs font-semibold ${tones[tone]}`}>{label}</Text>
    </View>
  );
}
