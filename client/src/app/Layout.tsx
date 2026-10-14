import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { NavLink, Outlet } from 'react-router';

const NAV_ITEMS = [{ to: '/employees', label: 'Employees' }];

export function Layout() {
  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 3 }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
            Salary Management
          </Typography>
          <Stack component="nav" aria-label="Main" direction="row" spacing={1}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                color="inherit"
                sx={{ '&.active': { bgcolor: 'rgba(255, 255, 255, 0.15)' } }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
