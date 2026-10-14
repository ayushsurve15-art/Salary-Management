import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { QueryError } from '../../components/QueryError';
import { CountryTable } from './CountryTable';
import { DistributionChart } from './DistributionChart';
import { EarnersList } from './EarnersList';
import { GroupStatsSection } from './GroupStatsSection';
import { headcountByCurrency, pickCurrency } from './insightsSummary';
import { useCountryStats } from './queries';
import { StatCard } from './StatCard';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack component="section" spacing={1.5}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

export function InsightsPage() {
  const countries = useCountryStats();
  const [searchParams, setSearchParams] = useSearchParams();

  if (countries.error) {
    return (
      <QueryError
        error={countries.error}
        what="insights"
        onRetry={() => void countries.refetch()}
      />
    );
  }
  if (!countries.data) return <Skeleton variant="rounded" height={400} />;

  const currencies = headcountByCurrency(countries.data);
  const currency = pickCurrency(searchParams.get('currency'), currencies);
  const headcount = currencies.reduce((sum, entry) => sum + entry.headcount, 0);

  return (
    <Stack spacing={4}>
      <div>
        <Typography variant="h4" component="h1">
          Insights
        </Typography>
        <Typography color="text.secondary">
          Every figure is in local currency. Amounts in different currencies are never added
          together.
        </Typography>
      </div>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard label="Employees" value={headcount.toLocaleString()} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Countries" value={String(countries.data.length)} />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatCard label="Currencies" value={String(currencies.length)} />
        </Grid>
      </Grid>

      <Section title="Pay by country">
        <CountryTable countries={countries.data} />
      </Section>

      {currency && (
        <>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Typography variant="h5" component="h2">
              Within one currency
            </Typography>
            <TextField
              select
              size="small"
              label="Currency"
              value={currency}
              sx={{ minWidth: 260 }}
              onChange={(event) => setSearchParams({ currency: event.target.value })}
            >
              {currencies.map((entry) => (
                <MenuItem key={entry.currency} value={entry.currency}>
                  {entry.currency} · {entry.countries.join(', ')} (
                  {entry.headcount.toLocaleString()})
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Section title="Pay by department and job title">
            <GroupStatsSection currency={currency} />
          </Section>
          <Section title="Salary distribution">
            <DistributionChart currency={currency} />
          </Section>
          <Section title="Top and bottom earners">
            <EarnersList currency={currency} />
          </Section>
        </>
      )}
      {!currency && <Typography>No employees yet, so there is nothing to show.</Typography>}
    </Stack>
  );
}
