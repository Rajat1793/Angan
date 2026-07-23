// tabIcon: builds a tab bar icon with a top active-indicator pill and a
// filled/outline swap driven by focus state.
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export function tabIcon(name: keyof typeof Ionicons.glyphMap) {
  const outline = `${name}-outline` as keyof typeof Ionicons.glyphMap;
  return function TabIcon({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) {
    return (
      <View className="items-center justify-center">
        <View
          className="mb-1 h-1 w-6 rounded-full"
          style={{ backgroundColor: focused ? color : 'transparent' }}
        />
        <Ionicons name={focused ? name : outline} size={size} color={color} />
      </View>
    );
  };
}
