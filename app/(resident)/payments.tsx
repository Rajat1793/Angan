// Resident payments: dues dashboard + Razorpay test checkout via WebView.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Badge, Button, Card, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import type { DueStatus } from '@/lib/database.types';
import { createOrder, listDues, listPaymentHistory, verifyPayment } from '@/lib/payments';
import { buildCheckoutHtml } from '@/lib/razorpay';
import { useAuthStore } from '@/store/auth.store';

const tone: Record<DueStatus, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  paid: 'success',
  overdue: 'danger',
};

export default function Payments() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [checkout, setCheckout] = useState<{ html: string; dueId: string; orderId: string } | null>(null);

  const dues = useQuery({ queryKey: ['dues'], queryFn: listDues });
  const history = useQuery({ queryKey: ['payments'], queryFn: listPaymentHistory });

  // Create an order server-side, then open the Razorpay WebView.
  const pay = async (dueId: string) => {
    try {
      const { order, keyId } = await createOrder(dueId);
      const html = buildCheckoutHtml({
        keyId,
        orderId: order.id,
        amount: order.amount,
        name: profile?.full_name ?? 'Resident',
        email: 'resident@angan.app',
      });
      setCheckout({ html, dueId, orderId: order.id });
    } catch (e) {
      toast((e as Error).message ?? 'Could not start payment', 'error');
    }
  };

  // Handle the message posted back from the checkout page.
  const onMessage = async (raw: string) => {
    const msg = JSON.parse(raw) as {
      type: string;
      response?: { razorpay_payment_id: string; razorpay_signature: string };
    };
    if (msg.type !== 'success' || !checkout || !msg.response) {
      setCheckout(null);
      return;
    }
    try {
      const res = await verifyPayment({
        dueId: checkout.dueId,
        orderId: checkout.orderId,
        paymentId: msg.response.razorpay_payment_id,
        signature: msg.response.razorpay_signature,
      });
      if (res.verified) {
        toast('Payment successful', 'success');
        queryClient.invalidateQueries({ queryKey: ['dues'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
      } else {
        toast('Verification failed', 'error');
      }
    } finally {
      setCheckout(null);
    }
  };

  if (dues.isLoading) return <Loading />;
  if (dues.isError) return <ErrorState onRetry={dues.refetch} />;

  return (
    <ScreenScaffold title="Payments">
      <ScrollView contentContainerClassName="gap-6 p-5">
        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Dues</Text>
          {(dues.data ?? []).map((d) => (
            <Card key={d.id} className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-foreground">
                  ₹{d.amount} · {d.period}
                </Text>
                <Badge label={d.status} tone={tone[d.status]} />
              </View>
              {d.status !== 'paid' ? (
                <Button label="Pay" onPress={() => pay(d.id)} />
              ) : null}
            </Card>
          ))}
        </View>

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">History</Text>
          {(history.data ?? []).map((p) => (
            <Card key={p.id}>
              <Text className="text-sm text-foreground">₹{p.amount}</Text>
              <Text className="text-xs text-foreground/50">
                {new Date(p.created_at).toLocaleString()}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Razorpay checkout runs in an in-app WebView (test mode). */}
      <Modal visible={!!checkout} animationType="slide" onRequestClose={() => setCheckout(null)}>
        {checkout ? (
          <WebView
            source={{ html: checkout.html }}
            onMessage={(e) => onMessage(e.nativeEvent.data)}
          />
        ) : null}
      </Modal>
    </ScreenScaffold>
  );
}
