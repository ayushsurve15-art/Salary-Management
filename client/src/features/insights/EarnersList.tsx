import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import type { Earner } from '../../api/types';
import { QueryError } from '../../components/QueryError';
import { formatMoney } from '../../lib/money';
import { useEarners } from './queries';

function EarnerColumn({ title, earners }: { title: string; earners: Earner[] }) {
  return (
    <Paper variant="outlined" sx={{ height: '100%' }}>
      <Typography variant="subtitle1" component="h3" sx={{ px: 2, pt: 1.5, fontWeight: 600 }}>
        {title}
      </Typography>
      <List dense>
        {earners.map((earner) => (
          <ListItem
            key={earner.id}
            secondaryAction={
              <Typography sx={{ fontWeight: 600 }}>
                {formatMoney(earner.salaryMinor, earner.currency)}
              </Typography>
            }
          >
            <ListItemText
              primary={
                <Link component={RouterLink} to={`/employees/${earner.id}`}>
                  {earner.firstName} {earner.lastName}
                </Link>
              }
              secondary={`${earner.jobTitle} · ${earner.country}`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export function EarnersList({ currency }: { currency: string }) {
  const earners = useEarners(currency);
  if (earners.error) {
    return (
      <QueryError error={earners.error} what="earners" onRetry={() => void earners.refetch()} />
    );
  }
  if (!earners.data) return <Skeleton variant="rounded" height={240} />;
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <EarnerColumn title="Top earners" earners={earners.data.top} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <EarnerColumn title="Bottom earners" earners={earners.data.bottom} />
      </Grid>
    </Grid>
  );
}
