import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { GroupDimension, GroupStats } from '../../api/types';
import { QueryError } from '../../components/QueryError';
import { formatMoney } from '../../lib/money';
import { MedianBar } from './MedianBar';
import { useGroupStats } from './queries';

const LABELS: Record<GroupDimension, string> = { department: 'Department', jobTitle: 'Job title' };

const money = (value: number | null, currency: string) =>
  value === null ? '–' : formatMoney(value, currency);

function GroupTable({ by, groups }: { by: GroupDimension; groups: GroupStats[] }) {
  if (groups.length === 0) {
    return <Typography sx={{ p: 3 }}>No employees are paid in this currency.</Typography>;
  }
  const highestMedian = Math.max(0, ...groups.map((group) => group.median ?? 0));
  const sorted = [...groups].sort((a, b) => (b.median ?? 0) - (a.median ?? 0));

  return (
    <TableContainer>
      <Table size="small" aria-label={`Pay by ${LABELS[by].toLowerCase()}`}>
        <TableHead>
          <TableRow>
            <TableCell>{LABELS[by]}</TableCell>
            <TableCell align="right">Headcount</TableCell>
            <TableCell align="right">25th pct</TableCell>
            <TableCell align="right">Median</TableCell>
            <TableCell align="right">75th pct</TableCell>
            <TableCell align="right">Average</TableCell>
            <TableCell sx={{ width: '20%' }}>Median compared</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((group) => (
            <TableRow key={group.key}>
              <TableCell>{group.key}</TableCell>
              <TableCell align="right">{group.headcount.toLocaleString()}</TableCell>
              <TableCell align="right">{money(group.p25, group.currency)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {money(group.median, group.currency)}
              </TableCell>
              <TableCell align="right">{money(group.p75, group.currency)}</TableCell>
              <TableCell align="right">{money(group.average, group.currency)}</TableCell>
              <TableCell>
                <MedianBar value={group.median ?? 0} max={highestMedian} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function GroupStatsSection({ currency }: { currency: string }) {
  const [by, setBy] = useState<GroupDimension>('department');
  const groups = useGroupStats(by, currency);

  return (
    <Paper variant="outlined">
      <Tabs value={by} onChange={(_event, value: GroupDimension) => setBy(value)}>
        <Tab value="department" label="By department" />
        <Tab value="jobTitle" label="By job title" />
      </Tabs>
      {groups.error ? (
        <QueryError error={groups.error} what="pay groups" onRetry={() => void groups.refetch()} />
      ) : groups.data ? (
        <GroupTable by={by} groups={groups.data} />
      ) : (
        <Skeleton variant="rectangular" height={240} />
      )}
    </Paper>
  );
}
