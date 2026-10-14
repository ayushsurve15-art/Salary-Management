import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import type { Employee, Page, SortField } from '../../api/types';
import { formatMoney } from '../../lib/money';
import { PAGE_SIZES, type ListParams } from './listParams';

type Column = { field: SortField; label: string; align?: 'right' };

const COLUMNS: Column[] = [
  { field: 'name', label: 'Name' },
  { field: 'email', label: 'Email' },
  { field: 'jobTitle', label: 'Job title' },
  { field: 'department', label: 'Department' },
  { field: 'country', label: 'Country' },
  { field: 'salary', label: 'Salary', align: 'right' },
  { field: 'hireDate', label: 'Hire date' },
];

type Props = {
  data: Page<Employee> | undefined;
  isFetching: boolean;
  params: ListParams;
  countryNames: Map<string, string>;
  onChange: (change: Partial<ListParams>) => void;
};

function LoadingRows({ pageSize }: { pageSize: number }) {
  return Array.from({ length: Math.min(pageSize, 10) }, (_, row) => (
    <TableRow key={row}>
      {COLUMNS.map((column) => (
        <TableCell key={column.field}>
          <Skeleton />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function EmployeeRow({ employee, countryName }: { employee: Employee; countryName: string }) {
  return (
    <TableRow hover>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Link component={RouterLink} to={`/employees/${employee.id}`}>
          {employee.firstName} {employee.lastName}
        </Link>
      </TableCell>
      <TableCell>{employee.email}</TableCell>
      <TableCell>{employee.jobTitle}</TableCell>
      <TableCell>{employee.department}</TableCell>
      <TableCell>{countryName}</TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        {formatMoney(employee.salaryMinor, employee.currency)}
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>{employee.hireDate}</TableCell>
    </TableRow>
  );
}

export function EmployeeTable({ data, isFetching, params, countryNames, onChange }: Props) {
  const toggleSort = (field: SortField) =>
    onChange({
      sort: field,
      order: params.sort === field && params.order === 'asc' ? 'desc' : 'asc',
    });

  return (
    <Paper variant="outlined">
      <Box sx={{ height: 4 }}>
        {isFetching && <LinearProgress aria-label="Loading employees" />}
      </Box>
      <TableContainer>
        <Table size="small" aria-label="Employees">
          <TableHead>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align ?? 'left'}
                  sortDirection={params.sort === column.field ? params.order : false}
                >
                  <TableSortLabel
                    active={params.sort === column.field}
                    direction={params.sort === column.field ? params.order : 'asc'}
                    onClick={() => toggleSort(column.field)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data === undefined ? (
              <LoadingRows pageSize={params.pageSize} />
            ) : (
              data.items.map((employee) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  countryName={countryNames.get(employee.country) ?? employee.country}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {data?.items.length === 0 && (
        <Typography sx={{ p: 3, textAlign: 'center' }} color="text.secondary">
          {data.total === 0
            ? 'No employees match these filters.'
            : 'This page is empty. Go back to an earlier page.'}
        </Typography>
      )}
      <TablePagination
        component="div"
        count={data?.total ?? 0}
        // MUI requires an in-range page, even when the URL points past the end.
        page={data ? Math.min(params.page - 1, Math.max(data.totalPages - 1, 0)) : 0}
        rowsPerPage={params.pageSize}
        rowsPerPageOptions={[...PAGE_SIZES]}
        onPageChange={(_event, page) => onChange({ page: page + 1 })}
        onRowsPerPageChange={(event) => onChange({ pageSize: Number(event.target.value) })}
      />
    </Paper>
  );
}
