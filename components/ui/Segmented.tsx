// Segmented: pill filter tabs with an animated sliding active indicator.
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

export interface SegmentOption {
  key: string;
  label: string;
  count?: number;
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const x = useRef(new Animated.Value(0)).current;
  const w = useRef(new Animated.Value(0)).current;

  const active = layouts[value];
  // Slide the indicator to sit behind the active pill once measured.
  useEffect(() => {
    if (!active) return;
    Animated.spring(x, { toValue: active.x, useNativeDriver: false, speed: 18, bounciness: 6 }).start();
    Animated.spring(w, { toValue: active.width, useNativeDriver: false, speed: 18, bounciness: 6 }).start();
  }, [active, x, w]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-3"
    >
      <View>
        {active ? (
          <Animated.View
            className="absolute bottom-0 top-0 rounded-full bg-primary"
            style={{ left: x, width: w }}
          />
        ) : null}
        <View className="flex-row gap-2">
          {options.map((o) => {
            const on = o.key === value;
            return (
              <Pressable
                key={o.key}
                onLayout={(e) =>
                  setLayouts((prev) => ({
                    ...prev,
                    [o.key]: { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width },
                  }))
                }
                onPress={() => onChange(o.key)}
                className="flex-row items-center gap-1.5 rounded-full px-4 py-2 active:opacity-70"
              >
                <Text
                  className={`text-sm font-medium ${on ? 'text-background' : 'text-foreground'}`}
                >
                  {o.label}
                </Text>
                {o.count != null ? (
                  <View
                    className={`h-5 min-w-5 items-center justify-center rounded-full px-1 ${
                      on ? 'bg-background/25' : 'bg-muted/20'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${on ? 'text-background' : 'text-foreground/60'}`}
                    >
                      {o.count}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
