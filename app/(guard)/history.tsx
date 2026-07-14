// Guard history tab: paginated visitor log with filters lands in Phase 3.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function GuardHistory() {
  return (
    <ScreenScaffold title="History">
      <Empty title="No history yet" hint="Past visitors will be listed here." />
    </ScreenScaffold>
  );
}
