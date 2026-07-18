// useFlats: cached society flat directory for the guard register picker.
import { useQuery } from '@tanstack/react-query';

import { listFlats } from '@/lib/flats';

export function useFlats(societyId?: string | null) {
  return useQuery({
    queryKey: ['flats', societyId],
    queryFn: () => listFlats(societyId as string),
    enabled: !!societyId,
    staleTime: 5 * 60 * 1000,
  });
}
