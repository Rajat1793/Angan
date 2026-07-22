// Guard daily-help attendance: mark each staff present/absent for today.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Pressable, Text, View } from 'react-native';

import { ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listStaffAttendance, markAttendance } from '@/lib/attendance';
import { useAuthStore } from '@/store/auth.store';

const today = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const day = today();

  const staff = useQuery({
    queryKey: ['attendance', day],
    queryFn: () => listStaffAttendance(day),
  });

  const mark = async (staffId: string, status: 'present' | 'absent') => {
    if (!profile?.society_id) return;
    try {
      await markAttendance(profile.society_id, staffId, day, status, profile.id);
      queryClient.invalidateQueries({ queryKey: ['attendance', day] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (staff.isLoading) return <Loading />;
  if (staff.isError) return <ErrorState onRetry={staff.refetch} />;

  return (
    <ScreenScaffold title="Staff attendance" subtitle="Daily help · today" showBack>
      <FlashList
        data={staff.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-2xl border border-muted/10 bg-background p-4">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
              <Text className="text-xs text-foreground/50">{item.role ?? 'Staff'}</Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => mark(item.id, 'present')}
                className={`rounded-full px-4 py-2 ${item.status === 'present' ? 'bg-primary' : 'bg-muted/10'}`}
              >
                <Text className={`text-xs font-semibold ${item.status === 'present' ? 'text-background' : 'text-foreground'}`}>
                  Present
                </Text>
              </Pressable>
              <Pressable
                onPress={() => mark(item.id, 'absent')}
                className={`rounded-full px-4 py-2 ${item.status === 'absent' ? 'bg-red-500' : 'bg-muted/10'}`}
              >
                <Text className={`text-xs font-semibold ${item.status === 'absent' ? 'text-white' : 'text-foreground'}`}>
                  Absent
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </ScreenScaffold>
  );
}
