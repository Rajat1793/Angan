// Guard visitors-inside tab: populated from status='inside' in Phase 3.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function GuardVisitors() {
  return (
    <ScreenScaffold title="Inside">
      <Empty title="No visitors inside" hint="Marked entries will appear here." />
    </ScreenScaffold>
  );
}
