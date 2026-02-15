import type { Ticket } from '../types/ticket';
import { getCustomFieldDate } from './ticketHelpers';

const CFP_LABELS = ['CFP_Submitted: Yes', 'CFP_Accepted: Yes'];
const STUDENTS_LABEL = 'Segment: Students';

/**
 * Filters tickets based on the active tab.
 * - "all": returns all tickets
 * - "statistics": returns all tickets (statistics are computed from the full set)
 * - "conferences": returns tickets with at least one CFP label
 * - "students": returns tickets with the "Segment: Students" label
 */
export function filterByTab(
  tickets: Ticket[],
  tab: string
): Ticket[] {
  if (tab === 'all' || tab === 'statistics') {
    return tickets;
  }

  if (tab === 'conferences') {
    return tickets.filter((ticket) => {
      return ticket.labels.some((name) => CFP_LABELS.includes(name));
    });
  }

  if (tab === 'students') {
    return tickets.filter((ticket) => {
      return ticket.labels.includes(STUDENTS_LABEL);
    });
  }

  return tickets;
}

/**
 * Groups tickets by status into assigned, accepted, and resolved arrays.
 * - Assigned: extensions.tt.status === "Assigned" or "Under Consideration"
 * - Accepted: extensions.tt.computedPendingReason === "Accepted" or extensions.tt.status === "In Progress"
 * - Resolved: extensions.tt.status === "Resolved"
 */
export function groupByStatus(tickets: Ticket[]): {
  assigned: Ticket[];
  accepted: Ticket[];
  resolved: Ticket[];
} {
  const assigned: Ticket[] = [];
  const accepted: Ticket[] = [];
  const resolved: Ticket[] = [];

  for (const ticket of tickets) {
    const status = ticket.extensions.tt.status;
    const pendingReason = ticket.extensions.tt.computedPendingReason;

    if (status === 'Assigned' || status === 'Under Consideration') {
      assigned.push(ticket);
    } else if (pendingReason === 'Accepted' || pendingReason === 'In Progress' || status === 'In Progress') {
      accepted.push(ticket);
    } else if (status === 'Resolved') {
      resolved.push(ticket);
    }
  }

  return { assigned, accepted, resolved };
}

/**
 * Convert a date string to local-timezone YYYY-MM-DD.
 * Returns empty string if the input is empty or invalid.
 */
function toLocalDateStr(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Filters tickets by date range using lexicographic string comparison
 * on ISO 8601 date strings (YYYY-MM-DD format).
 *
 * - Returns all tickets when no bounds are set.
 * - Returns empty array when start > end.
 * - Excludes tickets with empty date values when any bound is set.
 */
export function filterByDateRange(
  tickets: Ticket[],
  start?: string,
  end?: string,
): Ticket[] {
  if (!start && !end) return tickets;
  if (start && end && start > end) return [];
  return tickets.filter((t) => {
    const raw = getCustomFieldDate(t, 'date');
    if (!raw) return false;
    // Convert to local-timezone YYYY-MM-DD to match how dates display to the user
    const date = toLocalDateStr(raw);
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

