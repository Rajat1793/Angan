// VisitorDetailSheet: bottom-sheet modal showing a visitor's full details on tap.
// Rendered in a portal (above the tab bar), dims + closes on outside tap, and
// its content scrolls when it overflows.
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useCallback, useMemo } from 'react';
import { Image, Text, View } from 'react-native';

import { Badge } from '@/components/ui';
import { VisitorTimeline } from '@/components/visitor/VisitorTimeline';
import { useFlats } from '@/hooks/useFlats';
import { useTheme } from '@/hooks/useTheme';
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

export const VisitorDetailSheet = forwardRef<BottomSheetModal, { visitor: Visitor | null }>(
  ({ visitor }, ref) => {
    const { colors } = useTheme();
    // Resolve the visited flat's block/number label (e.g. A-101).
    const { data: flats } = useFlats(visitor?.society_id);
    const flatLabel = useMemo(
      () => flats?.find((f) => f.id === visitor?.flat_id)?.number ?? '—',
      [flats, visitor?.flat_id],
    );

    // Dimmed backdrop; tapping it closes the sheet.
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        enablePanDownToClose
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.primary }}
      >
        <BottomSheetScrollView contentContainerClassName="gap-1 p-5 pb-10">
          {visitor ? (
            <>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xl font-bold text-foreground">{visitor.name}</Text>
                <Badge label={visitor.status} tone={statusTone[visitor.status]} />
              </View>
              {visitor.photo_url ? (
                <Image
                  source={{ uri: visitor.photo_url }}
                  className="mb-3 h-52 w-full rounded-2xl bg-muted/10"
                  resizeMode="cover"
                />
              ) : null}
              <Row icon="pricetag" label="Type" value={visitor.type} />
              <Row icon="home" label="Flat" value={flatLabel} />
              <Row icon="document-text" label="Purpose" value={visitor.purpose ?? '—'} />
              <Row icon="call" label="Phone" value={visitor.phone ?? '—'} />
              <Row icon="car-sport" label="Vehicle" value={visitor.vehicle ?? '—'} />
              <Row icon="log-in" label="Entry" value={fmt(visitor.entry_at)} />
              <Row icon="log-out" label="Exit" value={fmt(visitor.exit_at)} />
              <Row icon="time" label="Created" value={fmt(visitor.created_at)} />
              {visitor.otp ? <Row icon="key" label="OTP" value={visitor.otp} /> : null}

              <Text className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-foreground/50">
                Status timeline
              </Text>
              <VisitorTimeline visitor={visitor} />
            </>
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
VisitorDetailSheet.displayName = 'VisitorDetailSheet';
