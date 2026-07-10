import { useQuery } from '@tanstack/react-query';
import { streakApi } from 'web/lib/dataService';
import { DBStreak } from 'web/types';

export function useStreaks() {
  return useQuery<DBStreak[], Error>({
    queryKey: ['streaks'],
    queryFn: streakApi.get,
  });
}
