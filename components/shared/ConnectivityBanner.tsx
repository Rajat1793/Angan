// ConnectivityBanner: drives the offline queue sync and shows a status strip.
import { OfflineBanner } from '@/components/ui';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function ConnectivityBanner() {
  const { online, pending } = useOfflineSync();
  // Only surface the banner when offline or there is queued work.
  if (online && pending === 0) return null;
  return <OfflineBanner pending={pending} />;
}
