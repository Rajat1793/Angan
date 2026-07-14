// App entry: shows a spinner while the root AuthGate resolves routing.
import { Loading } from '@/components/ui';

export default function Index() {
  // Actual redirect is handled centrally by AuthGate in the root layout.
  return <Loading label="Starting Angan…" />;
}
