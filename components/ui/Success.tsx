// Success: a celebratory full-screen checkmark overlay via a Zustand store + host.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { create } from 'zustand';

import { Ionicons } from '@expo/vector-icons';

import { ACCENTS } from '@/lib/accents';

interface SuccessState {
  message: string | null;
  celebrate: (message?: string) => void;
  clear: () => void;
}

// Call useSuccess.getState().celebrate('Done!') from anywhere.
export const useSuccess = create<SuccessState>((set) => ({
  message: null,
  celebrate: (message = 'Success') => set({ message }),
  clear: () => set({ message: null }),
}));

export function SuccessHost() {
  const { message, clear } = useSuccess();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    scale.setValue(0);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(clear);
    }, 1200);
    return () => clearTimeout(timer);
  }, [message, scale, opacity, clear]);

  if (!message) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ opacity }}
      className="absolute inset-0 items-center justify-center bg-black/30"
    >
      <View className="items-center gap-4 rounded-3xl bg-background px-10 py-8 shadow-lg">
        <Animated.View
          style={{ transform: [{ scale }], backgroundColor: ACCENTS.green }}
          className="h-20 w-20 items-center justify-center rounded-full"
        >
          <Ionicons name="checkmark" size={44} color="#fff" />
        </Animated.View>
        <Text className="text-base font-semibold text-foreground">{message}</Text>
      </View>
    </Animated.View>
  );
}
