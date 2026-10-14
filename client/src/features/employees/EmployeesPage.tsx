import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router';
import { QueryError } from '../../components/QueryError';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { useEmployeeList, useMeta } from './queries';
import { useListParams } from './useListParams';

export function EmployeesPage() {
  const [params, updateParams] = useListParams();
  const meta = useMeta();
  const list = useEmployeeList(params);
  const countryNames = new Map(meta.data?.countries.map((c) => [c.code, c.name]));

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Typography variant="h4" component="h1">
          Employees
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          {list.data && (
            <Typography color="text.secondary" aria-live="polite">
              {list.data.total.toLocaleString()} found
            </Typography>
          )}
          <Button variant="contained" component={Link} to="/employees/new">
            Add employee
          </Button>
        </Stack>
      </Stack>
      <EmployeeFilters params={params} meta={meta.data} onChange={updateParams} />
      {list.error ? (
        <QueryError error={list.error} what="employees" onRetry={() => void list.refetch()} />
      ) : (
        <EmployeeTable
          data={list.data}
          isFetching={list.isFetching}
          params={params}
          countryNames={countryNames}
          onChange={updateParams}
        />
      )}
    </Stack>
  );
}
