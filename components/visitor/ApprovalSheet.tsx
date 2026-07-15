// ApprovalSheet: bottom sheet for a resident to approve or deny a visitor.
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui';
import type { Visitor } from '@/lib/database.types';

interface ApprovalSheetProps {
  visitor: Visitor | null;
  onApprove: () => void;
  onDeny: () => void;
  busy?: boolean;
}

// Ref-driven sheet: the screen expands it when a visitor is tapped.
export const ApprovalSheet = forwardRef<BottomSheet, ApprovalSheetProps>(
  ({ visitor, onApprove, onDeny, busy }, ref) => (
    <BottomSheet
      ref={ref}
      index={-1}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: '#FCFDF3' }}
    >
      <BottomSheetView className="gap-4 p-5">
        {visitor ? (
          <>
            <View className="gap-1">
              <Text className="text-xl font-bold text-foreground">{visitor.name}</Text>
              <Text className="text-sm text-foreground/60">
                {visitor.type} · {visitor.purpose ?? '—'}
              </Text>
              {visitor.phone ? (
                <Text className="text-sm text-foreground/60">{visitor.phone}</Text>
              ) : null}
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="Deny" variant="outline" onPress={onDeny} loading={busy} />
              </View>
              <View className="flex-1">
                <Button label="Approve" onPress={onApprove} loading={busy} />
              </View>
            </View>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  ),
);
ApprovalSheet.displayName = 'ApprovalSheet';
