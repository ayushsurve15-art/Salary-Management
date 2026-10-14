import Box from '@mui/material/Box';

/** A small horizontal bar so groups can be compared at a glance; the number sits beside it. */
export function MedianBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0;
  return (
    <Box aria-hidden sx={{ height: 8, bgcolor: 'action.hover', borderRadius: 1, minWidth: 80 }}>
      <Box sx={{ height: '100%', width: `${width}%`, bgcolor: 'primary.main', borderRadius: 1 }} />
    </Box>
  );
}
