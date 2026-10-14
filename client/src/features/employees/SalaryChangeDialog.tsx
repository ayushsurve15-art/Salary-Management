import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import type { Employee } from '../../api/types';
import { todayIso } from '../../lib/dates';
import { formatMoney } from '../../lib/money';
import {
  toSalaryChangeInput,
  validateSalaryChange,
  type SalaryChangeValues,
} from './employeeFormValidation';
import { useChangeSalary } from './queries';

type Props = { employee: Employee; onClose: () => void };

/** Rendered only while open, so every opening starts from a clean form. */
export function SalaryChangeDialog({ employee, onClose }: Props) {
  const [values, setValues] = useState<SalaryChangeValues>({
    amount: '',
    effectiveDate: todayIso(),
    reason: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const change = useChangeSalary(employee.id);
  const options = { currency: employee.currency, hireDate: employee.hireDate, today: todayIso() };

  const serverErrors =
    change.error instanceof ApiError ? change.error.fieldErrors({ salaryMinor: 'amount' }) : {};
  const errors: Partial<Record<keyof SalaryChangeValues, string>> = {
    ...serverErrors,
    ...(submitted ? validateSalaryChange(values, options) : {}),
  };
  const isStale = change.error instanceof ApiError && change.error.status === 409;
  const hasFieldErrors = Object.keys(serverErrors).length > 0;
  const generalError = change.error && !isStale && !hasFieldErrors ? change.error.message : null;

  const set = (field: keyof SalaryChangeValues) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateSalaryChange(values, options)).length > 0) return;
    change.mutate(toSalaryChangeInput(values, employee), { onSuccess: onClose });
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="salary-change-title">
      <form noValidate onSubmit={handleSubmit}>
        <DialogTitle id="salary-change-title">Change salary</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Alert severity="info" icon={false}>
              Current salary: {formatMoney(employee.salaryMinor, employee.currency)}
            </Alert>
            {isStale && (
              <Alert severity="warning">
                {employee.firstName}&apos;s record changed since you opened this. We loaded the
                latest version; check it and submit again.
              </Alert>
            )}
            {generalError && <Alert severity="error">{generalError}</Alert>}
            <TextField
              label="New annual salary"
              required
              autoFocus
              inputMode="decimal"
              value={values.amount}
              onChange={set('amount')}
              error={errors.amount !== undefined}
              helperText={errors.amount}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">{employee.currency}</InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Effective date"
              type="date"
              required
              value={values.effectiveDate}
              onChange={set('effectiveDate')}
              error={errors.effectiveDate !== undefined}
              helperText={
                errors.effectiveDate ?? `On or after the hire date (${employee.hireDate})`
              }
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: { min: employee.hireDate, max: todayIso() },
              }}
            />
            <TextField
              label="Reason"
              required
              multiline
              minRows={2}
              placeholder="For example: annual review, promotion"
              value={values.reason}
              onChange={set('reason')}
              error={errors.reason !== undefined}
              helperText={errors.reason}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={change.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={change.isPending}>
            Save salary
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
