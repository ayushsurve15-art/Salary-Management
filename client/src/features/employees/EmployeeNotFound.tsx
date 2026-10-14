import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router';

export function EmployeeNotFound() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="h4" component="h1">
        Employee not found
      </Typography>
      <Typography color="text.secondary">
        They may have been deleted, or the link may be wrong.
      </Typography>
      <Button component={Link} to="/employees" variant="contained">
        Back to employees
      </Button>
    </Stack>
  );
}
