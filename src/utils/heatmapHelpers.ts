import type { Ticket } from '../types/ticket';
import { getCustomFieldDate } from './ticketHelpers';

/** Status used for cell coloring, ordered by priority (highest last). */
export type HeatmapStatus = 'assigned' | 'accepted' | 'resolved';

/** A single cell in the heatmap grid. */
export interface HeatmapCell {
  /** ISO date string (YYYY-MM-DD) for this cell. */
  date: string;
  /** Tickets falling on this date. */
  tickets: { title: string; status: HeatmapStatus }[];
  /** The dominant status for coloring, determined by Status_Priority. null if no tickets. */
  dominantStatus: HeatmapStatus | null;
}

/** The full grid structure ready for rendering. */
export interface HeatmapGrid {
  /** 2D array: rows are days of week (0=Sun..6=Sat), columns are weeks. */
  cells: (HeatmapCell | null)[][];
  /** Number of week columns. */
  weekCount: number;
  /** Month labels positioned at the week index where each month starts. */
  monthLabels: { label: string; weekIndex: number }[];
}

const STATUS_PRIORITY: Record<HeatmapStatus, number> = {
  assigned: 1,
  accepted: 2,
  resolved: 3,
};

const MONTH_ABBREVS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Classify a single ticket into a HeatmapStatus.
 * Uses the same priority logic as groupByStatus:
 *   1. Assigned: status === "Assigned"
 *   2. Accepted: computedPendingReason === "Accepted" (and status is NOT "Assigned")
 *   3. Resolved: status === "Resolved"
 * Returns null if the ticket doesn't match any known status.
 */
export function getTicketHeatmapStatus(ticket: Ticket): HeatmapStatus | null {
  const status = ticket.extensions.tt.status;
  const pendingReason = ticket.extensions.tt.computedPendingReason;

  if (status === 'Assigned' || status === 'Under Consideration') return 'assigned';
  if (pendingReason === 'Accepted' || pendingReason === 'In Progress' || status === 'In Progress') return 'accepted';
  if (status === 'Resolved') return 'resolved';
  return null;
}

/**
 * Determine the dominant status for a cell with multiple tickets.
 * Priority: resolved (3) > accepted (2) > assigned (1).
 * Returns null for an empty list.
 */
export function getDominantStatus(statuses: HeatmapStatus[]): HeatmapStatus | null {
  if (statuses.length === 0) return null;

  let dominant: HeatmapStatus = statuses[0];
  for (let i = 1; i < statuses.length; i++) {
    if (STATUS_PRIORITY[statuses[i]] > STATUS_PRIORITY[dominant]) {
      dominant = statuses[i];
    }
  }
  return dominant;
}

/**
 * Parse a date string into a Date object.
 * Returns null if the string is empty or produces an invalid date.
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Extract the local-timezone YYYY-MM-DD string from a Date.
 * This matches how ticket cards display dates to the user.
 */
function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a date string and return its local YYYY-MM-DD representation.
 * Returns null if the string is empty or produces an invalid date.
 */
function parseLocalDate(dateStr: string): string | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  return toLocalDateStr(d);
}

/**
 * Compute the aligned date range from tickets.
 * Uses the full year (Jan 1 – Dec 31) of the earliest ticket date,
 * then aligns start to Sunday and end to Saturday.
 * Returns null if no tickets have valid dates.
 */
export function computeDateRange(
  tickets: Ticket[]
): { start: Date; end: Date } | null {
  let earliestLocalDate: string | null = null;

  for (const ticket of tickets) {
    const dateStr = getCustomFieldDate(ticket, 'date');
    const localDate = parseLocalDate(dateStr);
    if (!localDate) continue;
    if (earliestLocalDate === null || localDate < earliestLocalDate) {
      earliestLocalDate = localDate;
    }
  }

  if (earliestLocalDate === null) return null;

  const year = parseInt(earliestLocalDate.slice(0, 4), 10);

  // Full year: Jan 1 – Dec 31, using UTC dates for grid math
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));

  // Align start to Sunday (day 0)
  const startDay = jan1.getUTCDay();
  const start = new Date(jan1);
  start.setUTCDate(start.getUTCDate() - startDay);

  // Align end to Saturday (day 6)
  const endDay = dec31.getUTCDay();
  const end = new Date(dec31);
  end.setUTCDate(end.getUTCDate() + (6 - endDay));

  return { start, end };
}

/**
 * Format a Date as YYYY-MM-DD string (UTC).
 */
function formatDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Build the full heatmap grid from a list of tickets.
 * Returns null if no renderable date range exists (empty tickets or all dateless).
 */
export function buildHeatmapGrid(tickets: Ticket[]): HeatmapGrid | null {
  if (tickets.length === 0) return null;

  const range = computeDateRange(tickets);
  if (!range) return null;

  const { start, end } = range;

  // Calculate week count
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weekCount = Math.ceil(totalDays / 7);

  // Build a map of date string -> tickets for that date
  const dateTicketMap = new Map<string, { title: string; status: HeatmapStatus }[]>();

  for (const ticket of tickets) {
    const dateStr = getCustomFieldDate(ticket, 'date');
    const localDate = parseLocalDate(dateStr);
    if (!localDate) continue;

    const heatmapStatus = getTicketHeatmapStatus(ticket);
    if (heatmapStatus === null) continue;

    if (!dateTicketMap.has(localDate)) {
      dateTicketMap.set(localDate, []);
    }
    dateTicketMap.get(localDate)!.push({ title: ticket.title, status: heatmapStatus });
  }

  // Build 7 rows x weekCount columns grid
  const cells: (HeatmapCell | null)[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: weekCount }, () => null)
  );

  // Fill cells
  const cursor = new Date(start);
  for (let week = 0; week < weekCount; week++) {
    for (let day = 0; day < 7; day++) {
      const dateKey = formatDate(cursor);
      const ticketsForDate = dateTicketMap.get(dateKey) ?? [];
      const statuses = ticketsForDate.map((t) => t.status);

      cells[day][week] = {
        date: dateKey,
        tickets: ticketsForDate,
        dominantStatus: getDominantStatus(statuses),
      };

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  // Build month labels
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < weekCount; week++) {
    // Use the Sunday (row 0) of each week to determine the month
    const cell = cells[0][week];
    if (!cell) continue;
    const cellDate = new Date(cell.date + 'T00:00:00Z');
    const month = cellDate.getUTCMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTH_ABBREVS[month], weekIndex: week });
      lastMonth = month;
    }
  }

  return { cells, weekCount, monthLabels };
}
