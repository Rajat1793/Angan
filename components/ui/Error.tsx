// ErrorState: shows an error message with a retry affordance.
import { Text, View } from 'react-native';

import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background p-6">
      <Text className="text-center text-base text-red-600">{message}</Text>
      {onRetry ? <Button label="Retry" variant="outline" onPress={onRetry} /> : null}
    </View>
  );
}
