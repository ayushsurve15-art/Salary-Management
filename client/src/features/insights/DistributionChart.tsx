import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { SalaryBand } from '../../api/types';
import { QueryError } from '../../components/QueryError';
import { formatMoney } from '../../lib/money';
import { useDistribution } from './queries';

const CHART_HEIGHT = 180;

function bandLabel(band: SalaryBand, currency: string): string {
  const range = `${formatMoney(band.from, currency)} to ${formatMoney(band.to, currency)}`;
  return `${range}: ${band.count.toLocaleString()} employees`;
}

export function DistributionChart({ currency }: { currency: string }) {
  const distribution = useDistribution(currency);
  if (distribution.error) {
    return (
      <QueryError
        error={distribution.error}
        what="salary distribution"
        onRetry={() => void distribution.refetch()}
      />
    );
  }
  if (!distribution.data) return <Skeleton variant="rounded" height={CHART_HEIGHT + 60} />;

  const { bands } = distribution.data;
  const largest = Math.max(1, ...bands.map((band) => band.count));
  const first = bands[0];
  const last = bands.at(-1);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box
        role="list"
        aria-label={`Salary distribution in ${currency}`}
        sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: CHART_HEIGHT }}
      >
        {bands.map((band) => (
          <Tooltip key={band.from} title={bandLabel(band, currency)}>
            <Box
              role="listitem"
              aria-label={bandLabel(band, currency)}
              tabIndex={0}
              sx={{
                flex: 1,
                height: `${(band.count / largest) * 100}%`,
                minHeight: band.count > 0 ? 2 : 0,
                bgcolor: 'primary.main',
                borderRadius: '4px 4px 0 0',
                '&:hover, &:focus-visible': { bgcolor: 'primary.dark' },
              }}
            />
          </Tooltip>
        ))}
      </Box>
      {first && last && (
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption">{formatMoney(first.from, currency)}</Typography>
          <Typography variant="caption">{formatMoney(last.to, currency)}</Typography>
        </Stack>
      )}
    </Paper>
  );
}
