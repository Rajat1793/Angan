// Input: labeled text field with inline error text for RHF forms.
import { Text, TextInput, type TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#9ca3af"
        className={`h-12 rounded-xl border px-3 text-foreground ${error ? 'border-red-500' : 'border-muted/20'}`}
        {...props}
      />
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
