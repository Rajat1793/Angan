// Admin dashboard: live society metrics + quick action to generate dues.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { getDashboardStats } from '@/lib/admin';
import { generateDues } from '@/lib/payments';

export default function AdminDashboard() {
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

  const cards = [
    { label: 'Residents', value: stats.data?.residents ?? 0 },
    { label: 'Open complaints', value: stats.data?.open_complaints ?? 0 },
    { label: 'Visitors inside', value: stats.data?.visitors_inside ?? 0 },
    { label: 'Dues collected', value: `₹${stats.data?.dues_collected ?? 0}` },
  ];

  return (
    <ScreenScaffold title="Dashboard">
      <View className="gap-4 p-5">
        <View className="flex-row flex-wrap gap-3">
          {cards.map((c) => (
            <Card key={c.label} className="w-[47%]">
              <Text className="text-2xl font-bold text-primary">{c.value}</Text>
              <Text className="text-xs text-foreground/60">{c.label}</Text>
            </Card>
          ))}
        </View>
        <Button label="Generate monthly dues" loading={busy} onPress={runDues} />
      </View>
    </ScreenScaffold>
  );
}
