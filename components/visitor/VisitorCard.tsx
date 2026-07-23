// VisitorCard: shared row with a type icon, key details, and status badge.
import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Badge, Card } from '@/components/ui';
import { ACCENTS, tint } from '@/lib/accents';
import type { Visitor, VisitorStatus, VisitorType } from '@/lib/database.types';

// Map each status to a badge tone for quick scanning.
const statusTone: Record<VisitorStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
  inside: 'info',
  exited: 'neutral',
};

// Map each status to an accent colour for the left strip + icon chip.
const statusColor: Record<VisitorStatus, string> = {
  pending: ACCENTS.amber,
  approved: ACCENTS.green,
  denied: ACCENTS.red,
  inside: ACCENTS.blue,
  exited: ACCENTS.slate,
};

// Map visitor type to a leading icon.
const typeIcon: Record<VisitorType, keyof typeof Ionicons.glyphMap> = {
  delivery: 'cube',
  cab: 'car',
  guest: 'person',
  service: 'construct',
};

export function VisitorCard({
  visitor,
  onPress,
  children,
}: {
  visitor: Visitor;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const color = statusColor[visitor.status];
  return (
    <Pressable onPress={onPress} disabled={!onPress} className={onPress ? 'active:scale-[0.98] active:opacity-70' : ''}>
      <Card className="gap-3 overflow-hidden pl-5">
        {/* Status-coloured left strip. */}
        <View
          className="absolute bottom-0 left-0 top-0 w-1.5"
          style={{ backgroundColor: color }}
        />
        <View className="flex-row items-center gap-3">
          {/* Leading icon chip tinted by the visitor's status. */}
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: tint(color) }}
          >
            <Ionicons name={typeIcon[visitor.type]} size={20} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{visitor.name}</Text>
            <Text className="text-sm text-foreground/60" numberOfLines={1}>
              {visitor.type} · {visitor.purpose ?? '—'}
            </Text>
          </View>
          <Badge label={visitor.status} tone={statusTone[visitor.status]} />
        </View>

        {/* Secondary meta line: phone, vehicle, and time. */}
        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
          {visitor.phone ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="call" size={12} color="#9ca3af" />
              <Text className="text-xs text-foreground/50">{visitor.phone}</Text>
            </View>
          ) : null}
          {visitor.vehicle ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="car-sport" size={12} color="#9ca3af" />
              <Text className="text-xs text-foreground/50">{visitor.vehicle}</Text>
            </View>
          ) : null}
          <View className="flex-row items-center gap-1">
            <Ionicons name="time" size={12} color="#9ca3af" />
            <Text className="text-xs text-foreground/50">
              {new Date(visitor.created_at).toLocaleString([], {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {children ? <View>{children}</View> : null}
      </Card>
    </Pressable>
  );
}
