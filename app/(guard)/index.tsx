// Guard dashboard (Gate): full-screen overview and large quick-action tiles.
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { useVisitors } from '@/hooks/useVisitors';

// A large tappable action tile that grows to fill the grid.
function BigTile({
  icon,
  title,
  subtitle,
  onPress,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 items-center justify-center gap-4 rounded-3xl border border-muted/10 bg-background p-5 shadow-sm active:opacity-70"
    >
      <View className="h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <Ionicons name={icon} size={40} color="#3E481D" />
        {badge ? (
          <View className="absolute -right-1.5 -top-1.5 h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1">
            <Text className="text-xs font-bold text-white">{badge}</Text>
          </View>
        ) : null}
      </View>
      <View className="items-center">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        <Text className="mt-0.5 text-center text-sm text-foreground/50">{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function GuardDashboard() {
  const { profile } = useAuth();
  const { unread } = useNotificationsList();
  // One query drives the overview counts and the "inside" badge.
  const { data, isLoading, isError, refetch } = useVisitors([
    'pending',
    'approved',
    'inside',
    'exited',
  ]);

  // Derive headline counts from the dataset.
  const { overview, insideNow } = useMemo(() => {
    const all = data ?? [];
    const entered = all.filter((v) => v.status === 'inside' || v.status === 'exited').length;
    const exited = all.filter((v) => v.status === 'exited').length;
    return {
      overview: [
        { label: 'Visitors', value: all.length },
        { label: 'Entered', value: entered },
        { label: 'Exited', value: exited },
      ],
      insideNow: entered - exited,
    };
  }, [data]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <ScreenScaffold
      title="Guard Dashboard"
      subtitle={`Hi, ${profile?.full_name?.split(' ')[0] ?? 'Guard'} 👋`}
      rightIcon="notifications-outline"
      rightBadge={unread}
      onRightPress={() => router.push('/notifications')}
    >
      <View className="flex-1 gap-4 p-5">
        {/* Enlarged overview card. */}
        <View className="rounded-3xl bg-primary p-6 shadow-sm">
          <Text className="mb-4 text-xs font-medium uppercase tracking-wide text-background/70">
            Today's overview
          </Text>
          <View className="flex-row">
            {overview.map((s, i) => (
              <View
                key={s.label}
                className={`flex-1 items-center ${i > 0 ? 'border-l border-background/20' : ''}`}
              >
                <Text className="text-4xl font-bold text-background">
                  {String(s.value).padStart(2, '0')}
                </Text>
                <Text className="mt-1 text-xs text-background/70">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Large action tiles fill the remaining screen height. */}
        <View className="flex-1 gap-4">
          <View className="flex-1 flex-row gap-4">
            <BigTile
              icon="person-add"
              title="Register"
              subtitle="Add a visitor at the gate"
              onPress={() => router.push('/(guard)/register')}
            />
            <BigTile
              icon="qr-code"
              title="Verify"
              subtitle="Scan QR or enter OTP"
              onPress={() => router.push('/(guard)/verify')}
            />
          </View>
          <View className="flex-1 flex-row gap-4">
            <BigTile
              icon="people"
              title="Visitors"
              subtitle="Browse & filter by status"
              badge={insideNow > 0 ? insideNow : undefined}
              onPress={() => router.push('/(guard)/visitors')}
            />
            <BigTile
              icon="time"
              title="History"
              subtitle="Entry / exit log"
              onPress={() => router.push('/(guard)/history')}
            />
          </View>
        </View>
      </View>
    </ScreenScaffold>
  );
}
