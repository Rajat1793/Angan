// ScreenScaffold: consistent safe-area page wrapper with a title header.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenScaffoldProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightBadge?: number;
  children?: React.ReactNode;
}

export function ScreenScaffold({
  title,
  subtitle,
  showBack,
  rightIcon,
  onRightPress,
  rightBadge,
  children,
}: ScreenScaffoldProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-muted/10 px-5 pb-3 pt-2">
        {showBack ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted/10"
          >
            <Ionicons name="chevron-back" size={20} color="#3E481D" />
          </Pressable>
        ) : null}
        <View className="flex-1">
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
            {rightBadge ? (
              <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1">
                <Text className="text-[10px] font-bold text-white">
                  {rightBadge > 99 ? '99+' : rightBadge}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
