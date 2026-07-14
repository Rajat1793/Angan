// Admin notices tab: publish + manage notices arrives in Phase 7/10.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function AdminNotices() {
  return (
    <ScreenScaffold title="Notices">
      <Empty title="No notices" hint="Publish society notices here." />
    </ScreenScaffold>
  );
}
