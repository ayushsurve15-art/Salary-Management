import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../../api/client';
import type { Employee, Meta } from '../../api/types';
import { QueryError } from '../../components/QueryError';
import { EmployeeForm } from './EmployeeForm';
import {
  EMPTY_EMPLOYEE_FORM,
  employeeToFormValues,
  toCreateInput,
  toUpdateInput,
  type EmployeeFormValues,
  type FormErrors,
} from './employeeFormValidation';
import { EmployeeNotFound } from './EmployeeNotFound';
import { useCreateEmployee, useEmployee, useMeta, useUpdateEmployee } from './queries';
import { useEmployeeId } from './useEmployeeId';

function serverFieldErrors(error: Error | null): FormErrors<EmployeeFormValues> {
  return error instanceof ApiError ? error.fieldErrors({ salaryMinor: 'salary' }) : {};
}

/** Errors that are not about one field, such as a duplicate email or a stale version. */
function serverMessage(error: Error | null, onReload?: () => void): ReactNode {
  if (!error || (error instanceof ApiError && error.code === 'VALIDATION_ERROR')) return null;
  const isStale = error instanceof ApiError && error.status === 409 && onReload !== undefined;
  return (
    <Alert
      severity="error"
      action={
        isStale ? (
          <Button color="inherit" size="small" onClick={onReload}>
            Reload
          </Button>
        ) : undefined
      }
    >
      {error.message}
    </Alert>
  );
}

function PageHeading({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h4" component="h1">
      {children}
    </Typography>
  );
}

function WithMeta({ children }: { children: (meta: Meta) => ReactNode }) {
  const meta = useMeta();
  if (meta.error) {
    return (
      <QueryError error={meta.error} what="form options" onRetry={() => void meta.refetch()} />
    );
  }
  return meta.data ? children(meta.data) : <Skeleton variant="rounded" height={320} />;
}

export function CreateEmployeePage() {
  const navigate = useNavigate();
  const create = useCreateEmployee();

  return (
    <Stack spacing={3}>
      <PageHeading>Add employee</PageHeading>
      <WithMeta>
        {(meta) => (
          <EmployeeForm
            mode="create"
            initialValues={EMPTY_EMPLOYEE_FORM}
            meta={meta}
            submitting={create.isPending}
            serverFieldErrors={serverFieldErrors(create.error)}
            serverMessage={serverMessage(create.error)}
            onCancel={() => void navigate('/employees')}
            onSubmit={(values, currency) =>
              create.mutate(toCreateInput(values, currency), {
                onSuccess: (employee) => void navigate(`/employees/${employee.id}`),
              })
            }
          />
        )}
      </WithMeta>
    </Stack>
  );
}

function EditEmployeeForm({ employee, onReload }: { employee: Employee; onReload: () => void }) {
  const navigate = useNavigate();
  const update = useUpdateEmployee(employee.id);
  const detailPath = `/employees/${employee.id}`;

  return (
    <WithMeta>
      {(meta) => (
        <EmployeeForm
          // A reload brings a new version; remount so the form shows the latest data.
          key={employee.version}
          mode="edit"
          initialValues={employeeToFormValues(employee)}
          meta={meta}
          submitting={update.isPending}
          serverFieldErrors={serverFieldErrors(update.error)}
          serverMessage={serverMessage(update.error, () => {
            update.reset();
            onReload();
          })}
          onCancel={() => void navigate(detailPath)}
          onSubmit={(values) =>
            update.mutate(toUpdateInput(values, employee.version), {
              onSuccess: () => void navigate(detailPath),
            })
          }
        />
      )}
    </WithMeta>
  );
}

function EditEmployeeLoader({ id }: { id: number }) {
  const employee = useEmployee(id);
  if (employee.error) {
    return employee.error instanceof ApiError && employee.error.status === 404 ? (
      <EmployeeNotFound />
    ) : (
      <QueryError error={employee.error} what="employee" onRetry={() => void employee.refetch()} />
    );
  }
  if (!employee.data) return <Skeleton variant="rounded" height={320} />;
  return (
    <Stack spacing={3}>
      <PageHeading>
        Edit {employee.data.firstName} {employee.data.lastName}
      </PageHeading>
      <EditEmployeeForm employee={employee.data} onReload={() => void employee.refetch()} />
    </Stack>
  );
}

export function EditEmployeePage() {
  const id = useEmployeeId();
  return id === null ? <EmployeeNotFound /> : <EditEmployeeLoader id={id} />;
}
