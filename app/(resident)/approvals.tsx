// Resident approvals: realtime pending queue with an approve/deny sheet.
import type BottomSheet from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, Empty, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { ApprovalSheet } from '@/components/visitor/ApprovalSheet';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { useVisitors } from '@/hooks/useVisitors';
import type { Visitor } from '@/lib/database.types';
import { setVisitorDecision } from '@/lib/visitors';

export default function Approvals() {
  const { data, isLoading, isError, refetch } = useVisitors(['pending']);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [busy, setBusy] = useState(false);

  // Open the decision sheet for the tapped visitor.
  const open = (visitor: Visitor) => {
    setSelected(visitor);
    sheetRef.current?.expand();
  };

  // Apply the resident's decision, then refresh and close the sheet.
  const decide = async (approved: boolean) => {
    if (!selected) return;
    setBusy(true);
    try {
      await setVisitorDecision(selected.id, approved);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast(approved ? 'Approved' : 'Denied', approved ? 'success' : 'info');
      sheetRef.current?.close();
    } catch (e) {
      toast((e as Error).message ?? 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScaffold title="Approvals">
      {/* Shortcut to pre-authorize an expected guest with a QR/OTP pass. */}
      <View className="px-4 pt-3">
        <Button
          label="Pre-approve a guest"
          variant="outline"
          onPress={() => router.push('/(resident)/preapprove')}
        />
      </View>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <Empty title="No pending approvals" hint="Visitor requests will appear here." />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <Text className="h-3" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => open(item)}>
              <VisitorCard visitor={item} />
            </Pressable>
          )}
        />
      )}

      <ApprovalSheet
        ref={sheetRef}
        visitor={selected}
        busy={busy}
        onApprove={() => decide(true)}
        onDeny={() => decide(false)}
      />
    </ScreenScaffold>
  );
}
