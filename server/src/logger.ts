type Level = 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

export type Logger = Record<Level, (message: string, fields?: Fields) => void>;

/** Writes one JSON line per entry so logs are easy to search in any hosting platform. */
export function createLogger(enabled = true): Logger {
  const write = (level: Level, message: string, fields: Fields = {}): void => {
    if (!enabled) return;
    const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields });
    const stream = level === 'info' ? process.stdout : process.stderr;
    stream.write(`${line}\n`);
  };
  return {
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
  };
}
