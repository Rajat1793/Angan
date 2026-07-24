// First-run onboarding: a short swipeable intro shown before login.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Typo } from '@/components/ui';
import { ACCENTS, tint } from '@/lib/accents';
import { useSettingsStore } from '@/store/settings.store';

const { width } = Dimensions.get('window');

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'shield-checkmark',
    color: ACCENTS.blue,
    title: 'Secure gate entry',
    body: 'Guards register visitors and you approve them in real time — no unexpected knocks.',
  },
  {
    icon: 'megaphone',
    color: ACCENTS.amber,
    title: 'Stay in the loop',
    body: 'Notices, polls, events and a community feed keep your society connected.',
  },
  {
    icon: 'card',
    color: ACCENTS.green,
    title: 'Pay dues in seconds',
    body: 'Track balances, pay maintenance, and keep every receipt in one place.',
  },
];

export default function Intro() {
  const setIntroSeen = useSettingsStore((s) => s.setIntroSeen);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const finish = () => {
    setIntroSeen(true);
    router.replace('/(auth)/login');
  };

  const next = () => {
    if (index >= SLIDES.length - 1) return finish();
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable onPress={finish} hitSlop={8}>
          <Text className="text-sm font-medium text-foreground/50">Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        className="flex-1"
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={{ width }} className="flex-1 items-center justify-center gap-6 px-10">
            <View
              className="h-32 w-32 items-center justify-center rounded-full"
              style={{ backgroundColor: tint(s.color) }}
            >
              <Ionicons name={s.icon} size={64} color={s.color} />
            </View>
            <View className="items-center gap-2">
              <Typo variant="title" className="text-center">
                {s.title}
              </Typo>
              <Text className="text-center text-base text-foreground/60">{s.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Page dots. */}
      <View className="flex-row justify-center gap-2 py-4">
        {SLIDES.map((s, i) => (
          <View
            key={s.title}
            className="h-2 rounded-full"
            style={{
              width: i === index ? 20 : 8,
              backgroundColor: i === index ? ACCENTS.primary : 'rgba(120,120,120,0.3)',
            }}
          />
        ))}
      </View>

      <View className="px-6 pb-6">
        <Button label={isLast ? 'Get started' : 'Next'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}
