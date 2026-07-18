// ScreenScaffold: consistent safe-area page wrapper with a title header.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  children?: React.ReactNode;
}

export function ScreenScaffold({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  children,
}: ScreenScaffoldProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-muted/10 px-5 pb-3 pt-2">
        <View>
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
          {subtitle ? (
            <Text className="text-sm text-foreground/50">{subtitle}</Text>
          ) : null}
        </View>
        {rightIcon ? (
          <Pressable
            onPress={onRightPress}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted/10"
          >
            <Ionicons name={rightIcon} size={20} color="#3E481D" />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
