// Resident payments tab: dues + Razorpay checkout arrive in Phase 9.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function Payments() {
  return (
    <ScreenScaffold title="Payments">
      <Empty title="No dues" hint="Your maintenance dues will appear here." />
    </ScreenScaffold>
  );
}
