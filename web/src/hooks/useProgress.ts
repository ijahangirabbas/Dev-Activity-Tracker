import { useQuery } from '@tanstack/react-query';
import { progressApi } from 'web/lib/dataService';
import { DailyProgress } from 'web/types';

export function useProgress() {
  return useQuery<DailyProgress[], Error>({
    queryKey: ['progress'],
    queryFn: progressApi.getAll,
  });
}
