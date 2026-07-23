// Skeleton: shimmering placeholder blocks for loading states.
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

export function Skeleton({ style }: { style?: ViewStyle }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  // A translucent band sweeps across the block to fake a shimmer sheen.
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        { overflow: 'hidden', backgroundColor: 'rgba(120,120,120,0.15)', borderRadius: 12 },
        style,
      ]}
    >
      {width > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <View
            style={{ width: width * 0.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.35)' }}
          />
        </Animated.View>
      ) : null}
    </View>
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
