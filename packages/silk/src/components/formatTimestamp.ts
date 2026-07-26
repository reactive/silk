export type TimestampStyle = 'full' | 'time';

/**
 * Deterministic ISO → display label for SSR-safe composite timestamps (UTC).
 * - `full` (default): "Jul 26, 11:00 AM" — posts, notifications
 * - `time`: "11:00 AM" — comments inside an already-dated thread
 */
export function formatTimestamp(
  iso: string,
  style: TimestampStyle = 'full',
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  if (style === 'time') {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    }).format(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}
