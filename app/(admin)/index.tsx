// Admin dashboard: metric cards placeholder; live stats arrive in Phase 10.
import { View } from 'react-native';

import { Card } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { Text } from 'react-native';

export default function AdminDashboard() {
  return (
    <ScreenScaffold title="Dashboard">
      <View className="flex-row flex-wrap gap-3 p-5">
        {['Residents', 'Open complaints', 'Visitors inside', 'Dues collected'].map(
          (label) => (
            <Card key={label} className="w-[47%]">
              <Text className="text-2xl font-bold text-primary">—</Text>
              <Text className="text-xs text-foreground/60">{label}</Text>
            </Card>
          ),
        )}
      </View>
    </ScreenScaffold>
  );
}
