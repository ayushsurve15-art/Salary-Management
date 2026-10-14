import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useNavigate } from 'react-router';
import type { Employee } from '../../api/types';
import { useDeleteEmployee } from './queries';

type Props = { employee: Employee; onClose: () => void };

export function DeleteEmployeeDialog({ employee, onClose }: Props) {
  const navigate = useNavigate();
  const remove = useDeleteEmployee(employee.id);
  const name = `${employee.firstName} ${employee.lastName}`;

  return (
    <Dialog open onClose={onClose} aria-labelledby="delete-employee-title">
      <DialogTitle id="delete-employee-title">Delete {name}?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This permanently removes {name} and their full salary history. It cannot be undone.
        </DialogContentText>
        {remove.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {remove.error.message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus disabled={remove.isPending}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          loading={remove.isPending}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => void navigate('/employees', { replace: true }),
            })
          }
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
