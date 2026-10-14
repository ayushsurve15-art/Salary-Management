export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

/** Calendar date in UTC as `YYYY-MM-DD`, which also sorts correctly as a string. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
