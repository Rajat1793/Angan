// Resident home: greeting hero, quick-action tiles, and a notices preview.
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Avatar,
  Card,
  ListRow,
  QuickAction,
  SectionHeader,
  Typo,
} from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { useVisitors } from '@/hooks/useVisitors';
import { ACCENTS } from '@/lib/accents';
import { listNotices } from '@/lib/community';

// Time-aware greeting for the hero card.
function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function ResidentHome() {
  const { profile } = useAuth();
  const { unread } = useNotificationsList();
  const pending = useVisitors(['pending']);
  const notices = useQuery({ queryKey: ['notices'], queryFn: listNotices });
  const pendingCount = pending.data?.length ?? 0;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'neighbour';
  const greeting = greetingFor(new Date().getHours());

  const heroStats = [
    { label: 'Approvals', value: pendingCount },
    { label: 'Notices', value: notices.data?.length ?? 0 },
    { label: 'Alerts', value: unread },
  ];

  return (
    <ScreenScaffold
      title="Home"
      subtitle={`Hi, ${firstName} 👋`}
      rightIcon="notifications-outline"
      rightBadge={unread}
      onRightPress={() => router.push('/notifications')}
    >
      <ScrollView contentContainerClassName="gap-6 p-5" showsVerticalScrollIndicator={false}>
        {/* Hero: avatar + greeting + today's stats — the visual centerpiece. */}
        <View className="rounded-3xl bg-primary p-5 shadow-sm">
          <View className="flex-row items-center gap-3">
            <Avatar name={profile?.full_name} size={48} solid />
            <View className="flex-1">
              <Text className="text-xs font-medium uppercase tracking-wide text-background/70">
                {greeting}
              </Text>
              <Typo variant="title" className="text-background">
                {firstName}
              </Typo>
            </View>
          </View>
          <View className="mt-5 flex-row border-t border-background/15 pt-4">
            {heroStats.map((s, i) => (
              <View
                key={s.label}
                className={`flex-1 items-center ${i > 0 ? 'border-l border-background/15' : ''}`}
              >
                <Text className="text-2xl font-bold text-background">{s.value}</Text>
                <Text className="mt-0.5 text-xs text-background/70">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <SectionHeader title="Quick actions" />
          <View className="flex-row gap-3">
            <QuickAction
              icon="checkmark-done-circle"
              label="Approvals"
              color={ACCENTS.blue}
              badge={pendingCount > 0 ? pendingCount : undefined}
              onPress={() => router.push('/(resident)/approvals')}
            />
            <QuickAction
              icon="qr-code"
              label="Pre-approve"
              color={ACCENTS.teal}
              onPress={() => router.push('/(resident)/preapprove')}
            />
            <QuickAction
              icon="calendar"
              label="Amenities"
              color={ACCENTS.indigo}
              onPress={() => router.push('/(resident)/amenities')}
            />
            <QuickAction
              icon="card"
              label="Payments"
              color={ACCENTS.green}
              onPress={() => router.push('/(resident)/payments')}
            />
          </View>
        </View>

        <View className="gap-3">
          <SectionHeader
            title="Society notices"
            actionLabel="View all"
            onAction={() => router.push('/(resident)/notices')}
          />
          {(notices.data ?? []).slice(0, 3).map((n) => (
            <Pressable key={n.id} onPress={() => router.push(`/(resident)/notice/${n.id}`)}>
              <Card className="flex-row items-start gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Text className="text-base">📢</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{n.title}</Text>
                  {n.body ? (
                    <Text className="text-xs text-foreground/60" numberOfLines={2}>
                      {n.body}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        <View className="gap-3">
          <SectionHeader title="More" />
          <ListRow
            icon="apps"
            title="Services"
            subtitle="SOS, deliveries, vehicles & more"
            color={ACCENTS.purple}
            onPress={() => router.push('/(resident)/services' as never)}
          />
          <ListRow
            icon="podium"
            title="Polls"
            subtitle="Vote on society decisions"
            color={ACCENTS.amber}
            onPress={() => router.push('/(resident)/polls')}
          />
          <ListRow
            icon="chatbox-ellipses"
            title="Raise a helpdesk ticket"
            subtitle="Report an issue to the admin"
            color={ACCENTS.red}
            onPress={() => router.push('/(resident)/helpdesk')}
          />
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
