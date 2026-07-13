// OfflineBanner: sticky strip shown while the device has no connectivity.
import { Text, View } from 'react-native';

export function OfflineBanner({ pending = 0 }: { pending?: number }) {
  return (
    <View className="w-full flex-row items-center justify-center bg-amber-500 px-3 py-1.5">
      <Text className="text-xs font-semibold text-white">
        Offline{pending > 0 ? ` · ${pending} queued` : ''}
      </Text>
    </View>
  );
}
