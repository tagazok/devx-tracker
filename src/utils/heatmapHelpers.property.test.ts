// Feature: activity-heatmap, Property 1: Date range correctness
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeDateRange, buildHeatmapGrid, getTicketHeatmapStatus, getDominantStatus } from './heatmapHelpers';
import type { HeatmapStatus } from './heatmapHelpers';
import type { Ticket } from '../types/ticket';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a valid ISO date string (YYYY-MM-DD) within a reasonable range. */
const isoDateArb = fc
  .date({
    min: new Date('2020-01-01T00:00:00Z'),
    max: new Date('2030-12-31T00:00:00Z'),
  })
  .map((d) => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

/** Arbitrary status value — includes the three meaningful values plus noise. */
const statusArb = fc.oneof(
  fc.constant('Assigned'),
  fc.constant('Resolved'),
  fc.constant('Pending'),
  fc.string({ minLength: 1, maxLength: 15 }),
);

/** Arbitrary computedPendingReason. */
const pendingReasonArb = fc.oneof(
  fc.constant('Accepted'),
  fc.constant(undefined as string | undefined),
  fc.string({ minLength: 1, maxLength: 15 }),
);

/** Build a ticket with an optional date value. */
function buildTicket(
  status: string,
  pendingReason: string | undefined,
  dateValue: string | null,
): Ticket {
  const dateFields =
    dateValue !== null ? [{ id: 'date', value: dateValue }] : [];
  return {
    title: 'test-ticket',
    id: 'id',
    aliases: [],
    labels: [],
    customFields: { string: [], date: dateFields, boolean: [], number: [] },
    extensions: {
      tt: {
        status,
        ...(pendingReason !== undefined
          ? { computedPendingReason: pendingReason }
          : {}),
      },
    },
    description: '',
    descriptionContentType: 'text/plain',
  };
}

/**
 * Ticket with a valid date.
 * Returns both the ticket and the raw date string for verification.
 */
const datedTicketArb = fc
  .tuple(statusArb, pendingReasonArb, isoDateArb)
  .map(([status, reason, dateStr]) => ({
    ticket: buildTicket(status, reason, dateStr),
    dateStr,
  }));

/**
 * Ticket without a date (empty date array or empty-string value).
 */
const datelessTicketArb = fc
  .tuple(
    statusArb,
    pendingReasonArb,
    fc.oneof(fc.constant(null), fc.constant('')),
  )
  .map(([status, reason, dateVal]) => ({
    ticket: buildTicket(status, reason, dateVal),
    dateStr: null as string | null,
  }));

/** Mixed array of dated and dateless tickets. */
const ticketSetArb = fc.array(
  fc.oneof(datedTicketArb, datelessTicketArb),
  { minLength: 0, maxLength: 30 },
);

// ---------------------------------------------------------------------------
// Property 1: Date range correctness
// ---------------------------------------------------------------------------

describe('Property 1: Date range correctness', () => {
  // **Validates: Requirements 1.1, 1.2**

  it('returns a full-year range (Jan 1 – Dec 31) of the earliest ticket year, aligned to weeks, or null if no valid dates', () => {
    fc.assert(
      fc.property(ticketSetArb, (entries) => {
        const tickets = entries.map((e) => e.ticket);
        const validDates = entries
          .filter((e) => e.dateStr !== null && e.dateStr !== '')
          .map((e) => new Date(e.dateStr + 'T00:00:00Z'));

        const result = computeDateRange(tickets);

        if (validDates.length === 0) {
          expect(result).toBeNull();
        } else {
          expect(result).not.toBeNull();

          const minDate = new Date(
            Math.min(...validDates.map((d) => d.getTime())),
          );
          const year = minDate.getUTCFullYear();
          const jan1 = new Date(Date.UTC(year, 0, 1));
          const dec31 = new Date(Date.UTC(year, 11, 31));

          // The range must contain Jan 1 and Dec 31 of the earliest ticket's year
          expect(result!.start.getTime()).toBeLessThanOrEqual(jan1.getTime());
          expect(result!.end.getTime()).toBeGreaterThanOrEqual(dec31.getTime());

          // All valid ticket dates should fall within the range
          for (const d of validDates) {
            expect(d.getTime()).toBeGreaterThanOrEqual(result!.start.getTime());
          }

          // The aligned start should be within 6 days before Jan 1 (same week)
          const daysBetweenStartAndJan1 = Math.round(
            (jan1.getTime() - result!.start.getTime()) / (1000 * 60 * 60 * 24),
          );
          expect(daysBetweenStartAndJan1).toBeGreaterThanOrEqual(0);
          expect(daysBetweenStartAndJan1).toBeLessThanOrEqual(6);

          // The aligned end should be within 6 days after Dec 31 (same week)
          const daysBetweenDec31AndEnd = Math.round(
            (result!.end.getTime() - dec31.getTime()) / (1000 * 60 * 60 * 24),
          );
          expect(daysBetweenDec31AndEnd).toBeGreaterThanOrEqual(0);
          expect(daysBetweenDec31AndEnd).toBeLessThanOrEqual(6);
        }
      }),
      { numRuns: 200 },
    );
  });
});

// Feature: activity-heatmap, Property 2: Week alignment
describe('Property 2: Week alignment', () => {
  // **Validates: Requirements 1.4**

  it('non-null date range start falls on Sunday (day 0) and end falls on Saturday (day 6)', () => {
    fc.assert(
      fc.property(ticketSetArb, (entries) => {
        const tickets = entries.map((e) => e.ticket);
        const result = computeDateRange(tickets);

        if (result === null) {
          // Vacuously true — no date range to check
          return;
        }

        // Start must be a Sunday (UTC day 0)
        expect(result.start.getUTCDay()).toBe(0);

        // End must be a Saturday (UTC day 6)
        expect(result.end.getUTCDay()).toBe(6);
      }),
      { numRuns: 200 },
    );
  });
});

// Feature: activity-heatmap, Property 3: Grid dimensions invariant
describe('Property 3: Grid dimensions invariant', () => {
  // **Validates: Requirements 2.1**

  it('non-null grid has exactly 7 rows and each row has weekCount columns matching the aligned date range', () => {
    fc.assert(
      fc.property(ticketSetArb, (entries) => {
        const tickets = entries.map((e) => e.ticket);
        const grid = buildHeatmapGrid(tickets);

        if (grid === null) {
          // Vacuously true — no grid to check
          return;
        }

        // Grid must have exactly 7 rows (one per day of the week)
        expect(grid.cells.length).toBe(7);

        // Each row must have exactly weekCount columns
        for (let row = 0; row < 7; row++) {
          expect(grid.cells[row].length).toBe(grid.weekCount);
        }

        // weekCount must match the number of weeks in the aligned date range
        const range = computeDateRange(tickets);
        expect(range).not.toBeNull();

        const totalDays =
          Math.round(
            (range!.end.getTime() - range!.start.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
        const expectedWeeks = Math.ceil(totalDays / 7);

        expect(grid.weekCount).toBe(expectedWeeks);
      }),
      { numRuns: 200 },
    );
  });
});

// Feature: activity-heatmap, Property 4: Ticket placement correctness
describe('Property 4: Ticket placement correctness', () => {
  // **Validates: Requirements 2.2, 2.3, 2.5**

  /**
   * Generator that produces tickets with unique titles so we can verify
   * each ticket is placed exactly once in the correct cell.
   */
  function buildTicketWithTitle(
    title: string,
    status: string,
    pendingReason: string | undefined,
    dateValue: string | null,
  ): Ticket {
    const dateFields =
      dateValue !== null ? [{ id: 'date', value: dateValue }] : [];
    return {
      title,
      id: 'id',
      aliases: [],
      labels: [],
      customFields: { string: [], date: dateFields, boolean: [], number: [] },
      extensions: {
        tt: {
          status,
          ...(pendingReason !== undefined
            ? { computedPendingReason: pendingReason }
            : {}),
        },
      },
      description: '',
      descriptionContentType: 'text/plain',
    };
  }

  /** Dated ticket with a unique title. */
  const datedTicketWithTitleArb = fc
    .tuple(
      fc.uuid(),
      statusArb,
      pendingReasonArb,
      isoDateArb,
    )
    .map(([title, status, reason, dateStr]) => ({
      ticket: buildTicketWithTitle(title, status, reason, dateStr),
      dateStr,
    }));

  /** Dateless ticket with a unique title. */
  const datelessTicketWithTitleArb = fc
    .tuple(
      fc.uuid(),
      statusArb,
      pendingReasonArb,
      fc.oneof(fc.constant(null), fc.constant('')),
    )
    .map(([title, status, reason, dateVal]) => ({
      ticket: buildTicketWithTitle(title, status, reason, dateVal),
      dateStr: null as string | null,
    }));

  /** Mixed array of dated and dateless tickets with unique titles. */
  const ticketSetWithTitlesArb = fc.array(
    fc.oneof(datedTicketWithTitleArb, datelessTicketWithTitleArb),
    { minLength: 0, maxLength: 30 },
  );

  it('every dated ticket with a non-null heatmap status appears exactly once in the correct cell; dateless and null-status tickets do not appear', () => {
    fc.assert(
      fc.property(ticketSetWithTitlesArb, (entries) => {
        // Ensure all titles are unique for this property to be meaningful
        const titles = entries.map((e) => e.ticket.title);
        fc.pre(new Set(titles).size === titles.length);

        const tickets = entries.map((e) => e.ticket);
        const grid = buildHeatmapGrid(tickets);

        // Collect all tickets from all cells in the grid
        const cellTicketMap = new Map<string, { title: string; status: string }[]>();
        const allCellTickets: { title: string; status: string; date: string }[] = [];

        if (grid !== null) {
          for (let day = 0; day < 7; day++) {
            for (let week = 0; week < grid.weekCount; week++) {
              const cell = grid.cells[day][week];
              if (cell && cell.tickets.length > 0) {
                for (const t of cell.tickets) {
                  allCellTickets.push({ title: t.title, status: t.status, date: cell.date });
                }
                if (!cellTicketMap.has(cell.date)) {
                  cellTicketMap.set(cell.date, []);
                }
                cellTicketMap.get(cell.date)!.push(...cell.tickets);
              }
            }
          }
        }

        // Determine the grid's actual date range from the first and last cells
        let gridStartDate: string | null = null;
        let gridEndDate: string | null = null;
        if (grid !== null) {
          gridStartDate = grid.cells[0][0]!.date;
          gridEndDate = grid.cells[6][grid.weekCount - 1]!.date;
        }

        for (const entry of entries) {
          const ticket = entry.ticket;
          const heatmapStatus = getTicketHeatmapStatus(ticket);
          const hasDatedEntry = entry.dateStr !== null && entry.dateStr !== '';

          // A ticket is in the grid range if its date falls within the grid's cell dates
          const dateInGridRange = hasDatedEntry && gridStartDate !== null && gridEndDate !== null &&
            entry.dateStr! >= gridStartDate && entry.dateStr! <= gridEndDate;

          if (hasDatedEntry && heatmapStatus !== null && dateInGridRange) {
            const matchesInGrid = allCellTickets.filter(
              (ct) => ct.title === ticket.title,
            );
            expect(matchesInGrid.length).toBe(1);
            expect(matchesInGrid[0].date).toBe(entry.dateStr);
            expect(matchesInGrid[0].status).toBe(heatmapStatus);
          } else {
            const matchesInGrid = allCellTickets.filter(
              (ct) => ct.title === ticket.title,
            );
            expect(matchesInGrid.length).toBe(0);
          }
        }
      }),
      { numRuns: 200 },
    );
  });
});


// Feature: activity-heatmap, Property 5: Dominant status priority
describe('Property 5: Dominant status priority', () => {
  // **Validates: Requirements 2.4**

  const heatmapStatusArb = fc.oneof(
    fc.constant('assigned' as HeatmapStatus),
    fc.constant('accepted' as HeatmapStatus),
    fc.constant('resolved' as HeatmapStatus),
  );

  const statusListArb = fc.array(heatmapStatusArb, { minLength: 0, maxLength: 30 });

  it('returns the highest-priority status present (resolved > accepted > assigned), or null for empty list', () => {
    fc.assert(
      fc.property(statusListArb, (statuses) => {
        const result = getDominantStatus(statuses);

        if (statuses.length === 0) {
          expect(result).toBeNull();
        } else if (statuses.includes('resolved')) {
          expect(result).toBe('resolved');
        } else if (statuses.includes('accepted')) {
          expect(result).toBe('accepted');
        } else {
          expect(result).toBe('assigned');
        }
      }),
      { numRuns: 200 },
    );
  });
});
