// Resident home: greeting hero, quick-action tiles, and a notices preview.
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  Card,
  ListRow,
  QuickAction,
  SectionHeader,
  StatStrip,
} from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { useVisitors } from '@/hooks/useVisitors';
import { listNotices } from '@/lib/community';

export default function ResidentHome() {
  const { profile } = useAuth();
  const { unread } = useNotificationsList();
  const pending = useVisitors(['pending']);
  const notices = useQuery({ queryKey: ['notices'], queryFn: listNotices });
  const pendingCount = pending.data?.length ?? 0;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'neighbour';

  return (
    <ScreenScaffold
      title="Home"
      subtitle={`Hi, ${firstName} 👋`}
      rightIcon="notifications-outline"
      rightBadge={unread}
      onRightPress={() => router.push('/notifications')}
    >
      <ScrollView contentContainerClassName="gap-6 p-5" showsVerticalScrollIndicator={false}>
        {/* Greeting hero banner. */}
        <View className="rounded-2xl bg-primary p-5 shadow-sm">
          <Text className="text-lg font-bold text-background">Good day, {firstName} ☀️</Text>
          <Text className="mt-1 text-sm text-background/80">
            Welcome back to your community.
          </Text>
        </View>

        {/* Today summary. */}
        <StatStrip
          title="Today"
          stats={[
            { label: 'Approvals', value: pendingCount },
            { label: 'Notices', value: notices.data?.length ?? 0 },
            { label: 'Alerts', value: unread },
          ]}
        />

        <View className="gap-3">
          <SectionHeader title="Quick actions" />
          <View className="flex-row gap-3">
            <QuickAction
              icon="checkmark-done-circle"
              label="Approvals"
              badge={pendingCount > 0 ? pendingCount : undefined}
              onPress={() => router.push('/(resident)/approvals')}
            />
            <QuickAction
              icon="qr-code"
              label="Pre-approve"
              onPress={() => router.push('/(resident)/preapprove')}
            />
            <QuickAction
              icon="calendar"
              label="Amenities"
              onPress={() => router.push('/(resident)/amenities')}
            />
            <QuickAction
              icon="card"
              label="Payments"
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
            onPress={() => router.push('/(resident)/services' as never)}
          />
          <ListRow
            icon="podium"
            title="Polls"
            subtitle="Vote on society decisions"
            onPress={() => router.push('/(resident)/polls')}
          />
          <ListRow
            icon="chatbox-ellipses"
            title="Raise a helpdesk ticket"
            subtitle="Report an issue to the admin"
            onPress={() => router.push('/(resident)/helpdesk')}
          />
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
