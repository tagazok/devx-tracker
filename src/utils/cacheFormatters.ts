/**
 * Format an ISO 8601 string to a human-readable date/time string
 * using the user's browser locale.
 *
 * Example output (en-US): "Feb 14, 2026 at 3:42 PM"
 */
export function formatCacheTimestamp(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Build the full banner message from optional timestamps.
 *
 * - Both null → empty string
 * - Only tickets → "Tickets data from {formatted}"
 * - Only meetups → "Meetups data from {formatted}"
 * - Both → "Tickets data from {formatted} — Meetups data from {formatted}"
 */
export function buildCacheBannerMessage(
  ticketsTimestamp: string | null,
  meetupsTimestamp: string | null,
): string {
  const parts: string[] = [];

  if (ticketsTimestamp) {
    parts.push(`Tickets data from ${formatCacheTimestamp(ticketsTimestamp)}`);
  }

  if (meetupsTimestamp) {
    parts.push(`Meetups data from ${formatCacheTimestamp(meetupsTimestamp)}`);
  }

  return parts.join(' \u2014 ');
}
