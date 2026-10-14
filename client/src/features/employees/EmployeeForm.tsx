import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState, type FormEvent, type ReactNode } from 'react';
import type { Meta } from '../../api/types';
import { todayIso } from '../../lib/dates';
import {
  validateEmployeeForm,
  type EmployeeFormValues,
  type FormErrors,
} from './employeeFormValidation';

type Props = {
  mode: 'create' | 'edit';
  initialValues: EmployeeFormValues;
  meta: Meta;
  submitting: boolean;
  serverFieldErrors: FormErrors<EmployeeFormValues>;
  serverMessage: ReactNode;
  onSubmit: (values: EmployeeFormValues, currency: string) => void;
  onCancel: () => void;
};

const fieldId = (field: keyof EmployeeFormValues) => `employee-${field}`;

export function EmployeeForm({
  mode,
  initialValues,
  meta,
  submitting,
  serverFieldErrors,
  serverMessage,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const validationOptions = { mode, countries: meta.countries, today: todayIso() };
  const clientErrors = submitted ? validateEmployeeForm(values, validationOptions) : {};
  const errors = { ...serverFieldErrors, ...clientErrors };
  const currency = meta.countries.find((c) => c.code === values.country)?.currency;

  const set = (field: keyof EmployeeFormValues) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  const textProps = (field: keyof EmployeeFormValues, label: string) => ({
    id: fieldId(field),
    label,
    value: values[field],
    onChange: (event: { target: { value: string } }) => set(field)(event.target.value),
    error: errors[field] !== undefined,
    helperText: errors[field],
    required: true,
    fullWidth: true,
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validateEmployeeForm(values, validationOptions);
    const firstInvalid = Object.keys(found)[0] as keyof EmployeeFormValues | undefined;
    if (firstInvalid) {
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    if (currency) onSubmit(values, currency);
  };

  const suggestionField = (field: 'department' | 'jobTitle', label: string, options: string[]) => (
    <Autocomplete
      id={fieldId(field)}
      freeSolo
      options={options}
      inputValue={values[field]}
      onInputChange={(_event, value) => set(field)(value)}
      renderInput={(params) => <TextField {...params} {...textProps(field, label)} />}
    />
  );

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack component="form" spacing={3} noValidate onSubmit={handleSubmit}>
        {serverMessage}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField {...textProps('firstName', 'First name')} autoFocus />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField {...textProps('lastName', 'Last name')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField {...textProps('email', 'Email')} type="email" autoComplete="off" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...textProps('hireDate', 'Hire date')}
              type="date"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayIso() } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {suggestionField('jobTitle', 'Job title', meta.jobTitles)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {suggestionField('department', 'Department', meta.departments)}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              {...textProps('country', 'Country')}
              select
              disabled={mode === 'edit'}
              helperText={
                errors.country ??
                (mode === 'edit' ? 'Country and currency are fixed after hiring' : undefined)
              }
            >
              {meta.countries.map((country) => (
                <MenuItem key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {mode === 'create' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                {...textProps('salary', 'Annual salary')}
                inputMode="decimal"
                helperText={errors.salary ?? 'Gross annual base salary in local currency'}
                slotProps={{
                  input: {
                    startAdornment: currency ? (
                      <InputAdornment position="start">{currency}</InputAdornment>
                    ) : undefined,
                  },
                }}
              />
            </Grid>
          )}
        </Grid>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submitting}>
            {mode === 'create' ? 'Add employee' : 'Save changes'}
          </Button>
        </Stack>
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" role="status">
            Please fix the highlighted fields.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
