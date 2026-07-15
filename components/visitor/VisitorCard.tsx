// VisitorCard: shared row showing a visitor's key details + status badge.
import { Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import type { Visitor, VisitorStatus } from '@/lib/database.types';

// Map each status to a badge tone for quick scanning.
const statusTone: Record<VisitorStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
  inside: 'info',
  exited: 'neutral',
};

export function VisitorCard({
  visitor,
  children,
}: {
  visitor: Visitor;
  children?: React.ReactNode;
}) {
  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">{visitor.name}</Text>
        <Badge label={visitor.status} tone={statusTone[visitor.status]} />
      </View>
      <Text className="text-sm text-foreground/60">
        {visitor.type} · {visitor.purpose ?? '—'}
        {visitor.vehicle ? ` · ${visitor.vehicle}` : ''}
      </Text>
      {children ? <View className="mt-1">{children}</View> : null}
    </Card>
  );
}
