import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { CountryStats } from '../../api/types';
import { formatMoney } from '../../lib/money';

const money = (value: number | null, currency: string) =>
  value === null ? '–' : formatMoney(value, currency);

export function CountryTable({ countries }: { countries: CountryStats[] }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Pay by country">
        <TableHead>
          <TableRow>
            <TableCell>Country</TableCell>
            <TableCell align="right">Headcount</TableCell>
            <TableCell align="right">Min</TableCell>
            <TableCell align="right">Median</TableCell>
            <TableCell align="right">Average</TableCell>
            <TableCell align="right">Max</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {countries.map((country) => (
            <TableRow key={country.key}>
              <TableCell>
                {country.countryName} ({country.currency})
              </TableCell>
              <TableCell align="right">{country.headcount.toLocaleString()}</TableCell>
              <TableCell align="right">{money(country.min, country.currency)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                {money(country.median, country.currency)}
              </TableCell>
              <TableCell align="right">{money(country.average, country.currency)}</TableCell>
              <TableCell align="right">{money(country.max, country.currency)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
