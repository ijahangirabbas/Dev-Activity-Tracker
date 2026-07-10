import { useQuery } from '@tanstack/react-query';
import { sessionApi } from 'web/lib/dataService';
import { DevSession } from 'web/types';

export function useSessions() {
  return useQuery<DevSession[], Error>({
    queryKey: ['sessions'],
    queryFn: sessionApi.getAll,
  });
}
