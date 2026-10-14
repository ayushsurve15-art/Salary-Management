import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ApiError } from '../../api/client';
import type { Employee } from '../../api/types';
import { QueryError } from '../../components/QueryError';
import { formatMoney } from '../../lib/money';
import { DeleteEmployeeDialog } from './DeleteEmployeeDialog';
import { EmployeeNotFound } from './EmployeeNotFound';
import { useEmployee, useMeta, useSalaryHistory } from './queries';
import { SalaryChangeDialog } from './SalaryChangeDialog';
import { useEmployeeId } from './useEmployeeId';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Typography component="dt" variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" sx={{ m: 0, fontWeight: 500 }}>
        {children}
      </Typography>
    </Grid>
  );
}

function Profile({ employee }: { employee: Employee }) {
  const countryName = useMeta().data?.countries.find((c) => c.code === employee.country)?.name;
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Grid container component="dl" spacing={2} sx={{ m: 0 }}>
        <Detail label="Current salary">
          {formatMoney(employee.salaryMinor, employee.currency)}
        </Detail>
        <Detail label="Email">{employee.email}</Detail>
        <Detail label="Country">
          {countryName ?? employee.country} ({employee.currency})
        </Detail>
        <Detail label="Hire date">{employee.hireDate}</Detail>
      </Grid>
    </Paper>
  );
}

function SalaryHistory({ employeeId }: { employeeId: number }) {
  const history = useSalaryHistory(employeeId);
  if (history.error) {
    return (
      <QueryError
        error={history.error}
        what="salary history"
        onRetry={() => void history.refetch()}
      />
    );
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Salary history">
        <TableHead>
          <TableRow>
            <TableCell>Effective date</TableCell>
            <TableCell align="right">Salary</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.data
            ? history.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.effectiveDate}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {formatMoney(entry.salaryMinor, entry.currency)}
                  </TableCell>
                  <TableCell>{entry.reason}</TableCell>
                </TableRow>
              ))
            : [0, 1, 2].map((row) => (
                <TableRow key={row}>
                  <TableCell colSpan={3}>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function EmployeeDetail({ employee }: { employee: Employee }) {
  const [dialog, setDialog] = useState<'salary' | 'delete' | null>(null);
  const close = () => setDialog(null);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <div>
          <Typography variant="h4" component="h1">
            {employee.firstName} {employee.lastName}
          </Typography>
          <Typography color="text.secondary">
            {employee.jobTitle} · {employee.department}
          </Typography>
        </div>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" onClick={() => setDialog('salary')}>
            Change salary
          </Button>
          <Button variant="outlined" component={Link} to={`/employees/${employee.id}/edit`}>
            Edit
          </Button>
          <Button color="error" onClick={() => setDialog('delete')}>
            Delete
          </Button>
        </Stack>
      </Stack>
      <Profile employee={employee} />
      <Typography variant="h6" component="h2">
        Salary history
      </Typography>
      <SalaryHistory employeeId={employee.id} />
      {dialog === 'salary' && <SalaryChangeDialog employee={employee} onClose={close} />}
      {dialog === 'delete' && <DeleteEmployeeDialog employee={employee} onClose={close} />}
    </Stack>
  );
}

function EmployeeDetailLoader({ id }: { id: number }) {
  const employee = useEmployee(id);
  if (employee.error) {
    return employee.error instanceof ApiError && employee.error.status === 404 ? (
      <EmployeeNotFound />
    ) : (
      <QueryError error={employee.error} what="employee" onRetry={() => void employee.refetch()} />
    );
  }
  return employee.data ? (
    <EmployeeDetail employee={employee.data} />
  ) : (
    <Skeleton variant="rounded" height={240} />
  );
}

export function EmployeeDetailPage() {
  const id = useEmployeeId();
  return id === null ? <EmployeeNotFound /> : <EmployeeDetailLoader id={id} />;
}
