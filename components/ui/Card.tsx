// Card: rounded surface container with muted border for list items.
import { View, type ViewProps } from 'react-native';

export function Card({ className = '', ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-2xl border border-muted/10 bg-background p-4 shadow-sm ${className}`}
      {...props}
    />
  );
}
