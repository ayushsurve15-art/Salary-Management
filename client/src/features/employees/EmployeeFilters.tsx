import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import type { Meta } from '../../api/types';
import { DebouncedTextField } from '../../components/DebouncedTextField';
import { hasActiveFilters, type ListParams } from './listParams';

type Props = {
  params: ListParams;
  meta: Meta | undefined;
  onChange: (change: Partial<ListParams>) => void;
};

type SelectFilterProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
};

function SelectFilter({ label, value, options, onChange }: SelectFilterProps) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <MenuItem value="">All</MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

const asOptions = (values: string[] = []) => values.map((value) => ({ value, label: value }));

export function EmployeeFilters({ params, meta, onChange }: Props) {
  const countries = meta?.countries ?? [];
  const currencies = [...new Set(countries.map((country) => country.currency))].sort();
  const salaryDisabled = params.currency === '';
  const salaryHelp = salaryDisabled ? 'Pick a currency first' : `In ${params.currency}`;

  return (
    <Grid container spacing={2} component="section" aria-label="Filters">
      <Grid size={{ xs: 12, md: 4 }}>
        <DebouncedTextField
          fullWidth
          size="small"
          label="Search name or email"
          type="search"
          value={params.search}
          onCommit={(search) => onChange({ search: search.trim() })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SelectFilter
          label="Country"
          value={params.country}
          options={countries.map((c) => ({ value: c.code, label: c.name }))}
          onChange={(country) => onChange({ country })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectFilter
          label="Department"
          value={params.department}
          options={asOptions(meta?.departments)}
          onChange={(department) => onChange({ department })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <SelectFilter
          label="Job title"
          value={params.jobTitle}
          options={asOptions(meta?.jobTitles)}
          onChange={(jobTitle) => onChange({ jobTitle })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <SelectFilter
          label="Currency"
          value={params.currency}
          options={asOptions(currencies)}
          onChange={(currency) =>
            onChange(currency ? { currency } : { currency, minSalary: '', maxSalary: '' })
          }
        />
      </Grid>
      <Grid size={{ xs: 6, md: 2 }}>
        <DebouncedTextField
          fullWidth
          size="small"
          label="Min salary"
          inputMode="decimal"
          disabled={salaryDisabled}
          helperText={salaryHelp}
          value={params.minSalary}
          onCommit={(minSalary) => onChange({ minSalary: minSalary.trim() })}
        />
      </Grid>
      <Grid size={{ xs: 6, md: 2 }}>
        <DebouncedTextField
          fullWidth
          size="small"
          label="Max salary"
          inputMode="decimal"
          disabled={salaryDisabled}
          helperText={salaryHelp}
          value={params.maxSalary}
          onCommit={(maxSalary) => onChange({ maxSalary: maxSalary.trim() })}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 'auto' }} sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Button
          disabled={!hasActiveFilters(params)}
          onClick={() =>
            onChange({
              search: '',
              country: '',
              department: '',
              jobTitle: '',
              currency: '',
              minSalary: '',
              maxSalary: '',
            })
          }
        >
          Clear filters
        </Button>
      </Grid>
    </Grid>
  );
}
