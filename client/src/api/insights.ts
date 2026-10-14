import { apiRequest, toQueryString } from './client';
import type { CountryStats, Distribution, Earners, GroupDimension, GroupStats } from './types';

export const insightsApi = {
  countries: () => apiRequest<CountryStats[]>('/insights/countries'),
  groups: (by: GroupDimension, currency: string) =>
    apiRequest<GroupStats[]>(`/insights/groups${toQueryString({ by, currency })}`),
  distribution: (currency: string, bands: number) =>
    apiRequest<Distribution>(`/insights/distribution${toQueryString({ currency, bands })}`),
  earners: (currency: string, limit: number) =>
    apiRequest<Earners>(`/insights/earners${toQueryString({ currency, limit })}`),
};
