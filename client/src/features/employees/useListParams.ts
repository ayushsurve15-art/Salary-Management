import { useSearchParams } from 'react-router';
import { parseListParams, toSearchParams, updateListParams, type ListParams } from './listParams';

export function useListParams(): [ListParams, (change: Partial<ListParams>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = parseListParams(searchParams);
  const update = (change: Partial<ListParams>) => {
    setSearchParams(toSearchParams(updateListParams(params, change)), { replace: true });
  };
  return [params, update];
}
