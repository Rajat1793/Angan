// Admin complaints tab: complaint triage + assignment arrive in Phase 10.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function AdminComplaints() {
  return (
    <ScreenScaffold title="Complaints">
      <Empty title="No complaints" hint="Tickets to triage will appear here." />
    </ScreenScaffold>
  );
}
