// Skeleton: animated placeholder blocks for loading states.
import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ opacity, backgroundColor: 'rgba(120,120,120,0.15)', borderRadius: 12 }, style]}
    />
  );
}

// A list of card-shaped skeletons for list/feed loading states.
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <View style={{ padding: 20, gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            gap: 8,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(120,120,120,0.12)',
          }}
        >
          <Skeleton style={{ height: 16, width: '55%' }} />
          <Skeleton style={{ height: 12, width: '80%' }} />
          <Skeleton style={{ height: 12, width: '40%' }} />
        </View>
      ))}
    </View>
  );
}
