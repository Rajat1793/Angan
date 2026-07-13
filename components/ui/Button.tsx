// Button: themed pressable with primary/outline/ghost variants + loading state.
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'outline' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

// Variant → Tailwind classes for container and label.
const container: Record<Variant, string> = {
  primary: 'bg-primary',
  outline: 'border border-primary bg-transparent',
  ghost: 'bg-transparent',
};
const text: Record<Variant, string> = {
  primary: 'text-background',
  outline: 'text-primary',
  ghost: 'text-primary',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-12 flex-row items-center justify-center rounded-xl px-4 ${container[variant]} ${isDisabled ? 'opacity-50' : 'active:opacity-80'}`}
    >
      {loading ? (
        <ActivityIndicator color="#FCFDF3" />
      ) : (
        <Text className={`text-base font-semibold ${text[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
