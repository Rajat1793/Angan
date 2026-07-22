// Admin dashboard: society overview stats + management shortcuts.
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  Card,
  ErrorState,
  ListRow,
  Loading,
  SectionHeader,
  useToast,
} from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { getDashboardStats } from '@/lib/admin';
import { generateDues } from '@/lib/payments';

// A single metric cell for the 2x2 overview grid.
function StatCell({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="w-[47%] gap-1">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={18} color="#3E481D" />
      </View>
      <Text className="mt-1 text-2xl font-bold text-foreground">{value}</Text>
      <Text className="text-xs text-foreground/60">{label}</Text>
    </Card>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { unread } = useNotificationsList();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [busy, setBusy] = useState(false);
  const stats = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardStats });

  // Bulk-generate this month's dues for every resident flat.
  const runDues = async () => {
    setBusy(true);
    try {
      const period = new Date().toISOString().slice(0, 7);
      const count = await generateDues(period, 2500);
      toast(`Generated ${count} dues`, 'success');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (stats.isLoading) return <Loading />;
  if (stats.isError) return <ErrorState onRetry={stats.refetch} />;

  return (
    <ScreenScaffold
      title="Admin Dashboard"
      subtitle={`Hi, ${profile?.full_name?.split(' ')[0] ?? 'Admin'} 👋`}
      rightIcon="notifications-outline"
      rightBadge={unread}
      onRightPress={() => router.push('/notifications')}
    >
      <ScrollView contentContainerClassName="gap-6 p-5" showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          <SectionHeader title="Society overview" />
          <View className="flex-row flex-wrap gap-3">
            <StatCell icon="people" label="Residents" value={stats.data?.residents ?? 0} />
            <StatCell
              icon="chatbox-ellipses"
              label="Open complaints"
              value={stats.data?.open_complaints ?? 0}
            />
            <StatCell
              icon="walk"
              label="Visitors inside"
              value={stats.data?.visitors_inside ?? 0}
            />
            <StatCell
              icon="cash"
              label="Dues collected"
              value={`₹${stats.data?.dues_collected ?? 0}`}
            />
          </View>
        </View>

        <View className="gap-3">
          <SectionHeader title="Management" />
          <ListRow
            icon="people"
            title="Residents"
            subtitle="Manage residents & flats"
            onPress={() => router.push('/(admin)/residents')}
          />
          <ListRow
            icon="chatbox-ellipses"
            title="Complaints"
            subtitle="Triage helpdesk tickets"
            badge={stats.data?.open_complaints || undefined}
            onPress={() => router.push('/(admin)/complaints')}
          />
          <ListRow
            icon="megaphone"
            title="Notices"
            subtitle="Publish & manage notices"
            onPress={() => router.push('/(admin)/notices')}
          />
          <ListRow
            icon="calendar"
            title="Events"
            subtitle="Create community events"
            onPress={() => router.push('/(admin)/events' as never)}
          />
          <ListRow
            icon="document-text"
            title="Documents"
            subtitle="Share society files"
            onPress={() => router.push('/(admin)/documents' as never)}
          />
          <ListRow
            icon="cash"
            title="Generate monthly dues"
            subtitle={busy ? 'Working…' : 'Bill every resident flat'}
            showChevron={false}
            onPress={runDues}
          />
          <ListRow
            icon="settings"
            title="Settings"
            subtitle="Theme & sign out"
            onPress={() => router.push('/(admin)/settings')}
          />
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
