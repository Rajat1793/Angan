// Guard alerts tab: society-wide alerts surface here.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function GuardAlerts() {
  return (
    <ScreenScaffold title="Alerts">
      <Empty title="No alerts" hint="Important gate alerts will show here." />
    </ScreenScaffold>
  );
}
