// Admin ticket detail: full ticket, status controls, and reply thread.
import { useLocalSearchParams } from 'expo-router';

import { TicketDetailView } from '@/components/shared/TicketDetailView';

export default function AdminTicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TicketDetailView id={String(id)} canManage />;
}
