import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useEffect, useRef, useState } from 'react';

type Props = Omit<TextFieldProps, 'value' | 'onChange'> & {
  value: string;
  onCommit: (value: string) => void;
  delayMs?: number;
};

/** A text field that reports its value only after the user pauses typing. */
export function DebouncedTextField({ value, onCommit, delayMs = 300, ...props }: Props) {
  const [text, setText] = useState(value);
  const [committed, setCommitted] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Follow outside changes, such as "Clear filters", without an extra effect.
  if (value !== committed) {
    setCommitted(value);
    setText(value);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <TextField
      {...props}
      value={text}
      onChange={(event) => {
        const next = event.target.value;
        setText(next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(next), delayMs);
      }}
    />
  );
}
