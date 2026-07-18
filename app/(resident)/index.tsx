// Resident home: greeting hero, quick-action tiles, and a notices preview.
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import {
  Card,
  ListRow,
  QuickAction,
  SectionHeader,
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
            onAction={() => router.push('/(resident)/community')}
          />
          {(notices.data ?? []).slice(0, 3).map((n) => (
            <Card key={n.id} className="flex-row items-start gap-3">
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
          ))}
        </View>

        <View className="gap-3">
          <SectionHeader title="Support" />
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
