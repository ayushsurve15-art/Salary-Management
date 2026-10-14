import { useParams } from 'react-router';

/** The `:id` route parameter as a positive integer, or null when it is not one. */
export function useEmployeeId(): number | null {
  const { id } = useParams();
  return id !== undefined && /^[1-9]\d{0,15}$/.test(id) ? Number(id) : null;
}
