// Admin residents tab: resident/flat management arrives in Phase 10.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function AdminResidents() {
  return (
    <ScreenScaffold title="Residents">
      <Empty title="No residents loaded" hint="Manage residents and flats here." />
    </ScreenScaffold>
  );
}
