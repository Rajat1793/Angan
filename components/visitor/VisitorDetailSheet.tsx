// VisitorDetailSheet: bottom sheet showing a visitor's full details on tap.
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';

import { Badge } from '@/components/ui';
import type { Visitor, VisitorStatus } from '@/lib/database.types';

const statusTone: Record<VisitorStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
  inside: 'info',
  exited: 'neutral',
};

// One labelled detail row with an icon.
function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-muted/10 py-3">
      <Ionicons name={icon} size={18} color="#6b7280" />
      <Text className="w-24 text-sm text-foreground/50">{label}</Text>
      <Text className="flex-1 text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}

// Format a nullable timestamp for display.
const fmt = (t: string | null) => (t ? new Date(t).toLocaleString() : '—');

export const VisitorDetailSheet = forwardRef<BottomSheet, { visitor: Visitor | null }>(
  ({ visitor }, ref) => (
    <BottomSheet ref={ref} index={-1} enablePanDownToClose backgroundStyle={{ backgroundColor: '#FCFDF3' }}>
      <BottomSheetView className="gap-1 p-5">
        {visitor ? (
          <>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-foreground">{visitor.name}</Text>
              <Badge label={visitor.status} tone={statusTone[visitor.status]} />
            </View>
            <Row icon="pricetag" label="Type" value={visitor.type} />
            <Row icon="document-text" label="Purpose" value={visitor.purpose ?? '—'} />
            <Row icon="call" label="Phone" value={visitor.phone ?? '—'} />
            <Row icon="car-sport" label="Vehicle" value={visitor.vehicle ?? '—'} />
            <Row icon="log-in" label="Entry" value={fmt(visitor.entry_at)} />
            <Row icon="log-out" label="Exit" value={fmt(visitor.exit_at)} />
            <Row icon="time" label="Created" value={fmt(visitor.created_at)} />
            {visitor.otp ? <Row icon="key" label="OTP" value={visitor.otp} /> : null}
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  ),
);
VisitorDetailSheet.displayName = 'VisitorDetailSheet';
