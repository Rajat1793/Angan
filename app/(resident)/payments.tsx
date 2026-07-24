// Resident payments: dues dashboard + Razorpay test checkout via WebView.
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Badge, Button, Card, DonutChart, ErrorState, Loading, useSuccess, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { ACCENTS, tint } from '@/lib/accents';
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
  const celebrate = useSuccess((s) => s.celebrate);
  const [checkout, setCheckout] = useState<{ html: string; dueId: string; orderId: string } | null>(null);

  const dues = useQuery({ queryKey: ['dues'], queryFn: listDues });
  const history = useQuery({ queryKey: ['payments'], queryFn: listPaymentHistory });

  // Totals for the summary donut: outstanding vs settled.
  const summary = useMemo(() => {
    const rows = dues.data ?? [];
    const due = rows
      .filter((d) => d.status !== 'paid')
      .reduce((a, d) => a + d.amount, 0);
    const paid = rows.filter((d) => d.status === 'paid').reduce((a, d) => a + d.amount, 0);
    return { due, paid };
  }, [dues.data]);

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
        celebrate('Payment successful');
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
        {/* Summary: outstanding balance with a paid/due donut. */}
        <Card className="flex-row items-center gap-5">
          <DonutChart
            size={104}
            strokeWidth={14}
            segments={[
              { value: summary.paid, color: ACCENTS.green },
              { value: summary.due, color: ACCENTS.amber },
            ]}
          >
            <View className="items-center">
              <Text className="text-[10px] uppercase tracking-wide text-foreground/50">Due</Text>
              <Text className="text-lg font-bold text-foreground">₹{summary.due}</Text>
            </View>
          </DonutChart>
          <View className="flex-1 gap-2">
            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: ACCENTS.amber }} />
              <Text className="text-sm text-foreground/70">Outstanding</Text>
              <Text className="ml-auto text-sm font-semibold text-foreground">₹{summary.due}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: ACCENTS.green }} />
              <Text className="text-sm text-foreground/70">Paid</Text>
              <Text className="ml-auto text-sm font-semibold text-foreground">₹{summary.paid}</Text>
            </View>
          </View>
        </Card>

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
          <Text className="text-lg font-bold text-foreground">Receipts</Text>
          {(history.data ?? []).length === 0 ? (
            <Text className="text-sm text-foreground/50">No payments yet.</Text>
          ) : (
            (history.data ?? []).map((p) => (
              <Card key={p.id} className="flex-row items-center gap-3">
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: tint(ACCENTS.green) }}
                >
                  <Ionicons name="receipt" size={18} color={ACCENTS.green} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">₹{p.amount}</Text>
                  <Text className="text-xs text-foreground/50">
                    {new Date(p.created_at).toLocaleString([], {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {p.razorpay_payment_id ? (
                  <Text className="max-w-28 text-right text-[10px] text-foreground/40" numberOfLines={1}>
                    {p.razorpay_payment_id}
                  </Text>
                ) : null}
              </Card>
            ))
          )}
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
