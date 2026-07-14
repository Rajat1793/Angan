// Guard visitor registration: full form + camera capture arrive in Phase 3.
import { router } from 'expo-router';

import { Empty } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';

export default function Register() {
  return (
    <ScreenScaffold title="Register visitor">
      <Empty
        title="Registration form"
        hint="The full capture flow is built in Phase 3."
        actionLabel="Back to gate"
        onAction={() => router.back()}
      />
    </ScreenScaffold>
  );
}
