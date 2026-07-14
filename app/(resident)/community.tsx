// Resident community tab: notices and polls land in Phase 7.
import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function Community() {
  return (
    <ScreenScaffold title="Community">
      <Empty title="Nothing yet" hint="Notices and polls will show up here." />
    </ScreenScaffold>
  );
}
