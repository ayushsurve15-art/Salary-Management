import { useQuery } from '@tanstack/react-query';
import { insightsApi } from '../../api/insights';
import type { GroupDimension } from '../../api/types';

const DISTRIBUTION_BANDS = 12;
const EARNERS_LIMIT = 5;

// Keys start with 'insights' so employee writes can invalidate all of them at once.
export function useCountryStats() {
  return useQuery({ queryKey: ['insights', 'countries'], queryFn: insightsApi.countries });
}

export function useGroupStats(by: GroupDimension, currency: string) {
  return useQuery({
    queryKey: ['insights', 'groups', by, currency],
    queryFn: () => insightsApi.groups(by, currency),
  });
}

export function useDistribution(currency: string) {
  return useQuery({
    queryKey: ['insights', 'distribution', currency],
    queryFn: () => insightsApi.distribution(currency, DISTRIBUTION_BANDS),
  });
}

export function useEarners(currency: string) {
  return useQuery({
    queryKey: ['insights', 'earners', currency],
    queryFn: () => insightsApi.earners(currency, EARNERS_LIMIT),
  });
}
