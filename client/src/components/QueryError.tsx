import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

type Props = { error: Error; onRetry: () => void; what: string };

export function QueryError({ error, onRetry, what }: Props) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      Could not load {what}. {error.message}
    </Alert>
  );
}
