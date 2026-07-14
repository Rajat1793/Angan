// ScreenScaffold: consistent safe-area page wrapper with a title header.
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenScaffoldProps {
  title: string;
  children?: React.ReactNode;
}

export function ScreenScaffold({ title, children }: ScreenScaffoldProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-muted/10 px-5 pb-3 pt-2">
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
      </View>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
