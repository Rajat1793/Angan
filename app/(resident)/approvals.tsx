// Resident approvals tab: visitor approval queue is built in Phase 3.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function Approvals() {
  return (
    <ScreenScaffold title="Approvals">
      <Empty title="No pending approvals" hint="Visitor requests will appear here." />
    </ScreenScaffold>
  );
}
