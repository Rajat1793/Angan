// Guard settings tab: sound/haptics/theme knobs, updates, and sign-out.
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { SettingsPanel } from '@/components/shared/SettingsPanel';

export default function GuardSettings() {
  return (
    <ScreenScaffold title="Settings">
      <SettingsPanel />
    </ScreenScaffold>
  );
}
