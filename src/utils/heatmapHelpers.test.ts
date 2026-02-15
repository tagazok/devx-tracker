import { describe, it, expect } from 'vitest';
import {
  computeDateRange,
  buildHeatmapGrid,
  getDominantStatus,
  getTicketHeatmapStatus,
} from './heatmapHelpers';
import type { Ticket } from '../types/ticket';

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    title: 'Test Ticket',
    id: 'ticket-1',
    aliases: [],
    labels: [],
    customFields: { string: [], date: [], boolean: [], number: [] },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: 'text/plain',
    ...overrides,
  };
}

function makeTicketWithDate(date: string, overrides: Partial<Ticket> = {}): Ticket {
  return makeTicket({
    customFields: {
      string: [],
      date: [{ id: 'date', value: date }],
      boolean: [],
      number: [],
    },
    ...overrides,
  });
}

describe('getTicketHeatmapStatus', () => {
  it('returns "assigned" for status "Assigned"', () => {
    const ticket = makeTicket({ extensions: { tt: { status: 'Assigned' } } });
    expect(getTicketHeatmapStatus(ticket)).toBe('assigned');
  });

  it('returns "accepted" for computedPendingReason "Accepted" (non-Assigned status)', () => {
    const ticket = makeTicket({
      extensions: { tt: { status: 'Pending', computedPendingReason: 'Accepted' } },
    });
    expect(getTicketHeatmapStatus(ticket)).toBe('accepted');
  });

  it('returns "resolved" for status "Resolved"', () => {
    const ticket = makeTicket({ extensions: { tt: { status: 'Resolved' } } });
    expect(getTicketHeatmapStatus(ticket)).toBe('resolved');
  });

  it('returns null for unknown status', () => {
    const ticket = makeTicket({ extensions: { tt: { status: 'Unknown' } } });
    expect(getTicketHeatmapStatus(ticket)).toBeNull();
  });

  it('prioritizes "Assigned" over "Accepted" pendingReason', () => {
    const ticket = makeTicket({
      extensions: { tt: { status: 'Assigned', computedPendingReason: 'Accepted' } },
    });
    expect(getTicketHeatmapStatus(ticket)).toBe('assigned');
  });
});

describe('getDominantStatus', () => {
  it('returns null for empty array', () => {
    expect(getDominantStatus([])).toBeNull();
  });

  it('returns "resolved" when present', () => {
    expect(getDominantStatus(['assigned', 'accepted', 'resolved'])).toBe('resolved');
  });

  it('returns "accepted" when no resolved', () => {
    expect(getDominantStatus(['assigned', 'accepted'])).toBe('accepted');
  });

  it('returns "assigned" when only assigned', () => {
    expect(getDominantStatus(['assigned', 'assigned'])).toBe('assigned');
  });

  it('returns single status for single-element array', () => {
    expect(getDominantStatus(['accepted'])).toBe('accepted');
  });
});

describe('computeDateRange', () => {
  it('returns null for empty ticket list', () => {
    expect(computeDateRange([])).toBeNull();
  });

  it('returns null when all tickets lack dates', () => {
    const tickets = [makeTicket(), makeTicket({ id: 'ticket-2' })];
    expect(computeDateRange(tickets)).toBeNull();
  });

  it('returns full year range for single ticket', () => {
    // 2024-03-13 → full year Jan 1 – Dec 31, 2024, aligned to weeks
    const ticket = makeTicketWithDate('2024-03-13');
    const result = computeDateRange([ticket]);
    expect(result).not.toBeNull();
    // 2024-01-01 is Monday, so aligned Sunday is 2023-12-31
    expect(result!.start.toISOString().slice(0, 10)).toBe('2023-12-31');
    // 2024-12-31 is Tuesday, so aligned Saturday is 2025-01-04
    expect(result!.end.toISOString().slice(0, 10)).toBe('2025-01-04');
  });

  it('aligns start to Sunday and end to Saturday', () => {
    // 2024-01-03 (Wed) to 2024-01-05 (Fri)
    const tickets = [
      makeTicketWithDate('2024-01-03', { id: 't1' }),
      makeTicketWithDate('2024-01-05', { id: 't2' }),
    ];
    const result = computeDateRange(tickets);
    expect(result).not.toBeNull();
    // Sunday before Jan 3 is Dec 31
    expect(result!.start.getUTCDay()).toBe(0); // Sunday
    expect(result!.end.getUTCDay()).toBe(6); // Saturday
  });

  it('excludes tickets with empty date strings', () => {
    const withDate = makeTicketWithDate('2024-06-15', { id: 't1' });
    const withEmpty = makeTicket({
      id: 't2',
      customFields: {
        string: [],
        date: [{ id: 'date', value: '' }],
        boolean: [],
        number: [],
      },
    });
    const result = computeDateRange([withDate, withEmpty]);
    expect(result).not.toBeNull();
  });

  it('handles invalid date strings gracefully', () => {
    const invalid = makeTicket({
      id: 't1',
      customFields: {
        string: [],
        date: [{ id: 'date', value: 'not-a-date' }],
        boolean: [],
        number: [],
      },
    });
    expect(computeDateRange([invalid])).toBeNull();
  });
});

describe('buildHeatmapGrid', () => {
  it('returns null for empty ticket list', () => {
    expect(buildHeatmapGrid([])).toBeNull();
  });

  it('returns null when all tickets lack dates', () => {
    const tickets = [makeTicket(), makeTicket({ id: 't2' })];
    expect(buildHeatmapGrid(tickets)).toBeNull();
  });

  it('returns grid spanning full year for single ticket', () => {
    const ticket = makeTicketWithDate('2024-03-13');
    const grid = buildHeatmapGrid([ticket]);
    expect(grid).not.toBeNull();
    expect(grid!.cells.length).toBe(7); // 7 rows (days)
    // Full year 2024 aligned to weeks: ~53 weeks
    expect(grid!.weekCount).toBeGreaterThanOrEqual(52);
    expect(grid!.weekCount).toBeLessThanOrEqual(54);
  });

  it('places multiple tickets on same date in same cell', () => {
    const t1 = makeTicketWithDate('2024-03-13', {
      id: 't1',
      title: 'Ticket A',
      extensions: { tt: { status: 'Assigned' } },
    });
    const t2 = makeTicketWithDate('2024-03-13', {
      id: 't2',
      title: 'Ticket B',
      extensions: { tt: { status: 'Resolved' } },
    });
    const grid = buildHeatmapGrid([t1, t2]);
    expect(grid).not.toBeNull();

    // Find the cell with date 2024-03-13 (Wednesday = day index 3)
    const targetCell = grid!.cells[3].find((c) => c?.date === '2024-03-13');
    expect(targetCell).not.toBeNull();
    expect(targetCell!.tickets).toHaveLength(2);
    expect(targetCell!.tickets.map((t) => t.title).sort()).toEqual(['Ticket A', 'Ticket B']);
  });

  it('uses correct dominant status for mixed-status cells', () => {
    const t1 = makeTicketWithDate('2024-03-13', {
      id: 't1',
      extensions: { tt: { status: 'Assigned' } },
    });
    const t2 = makeTicketWithDate('2024-03-13', {
      id: 't2',
      extensions: { tt: { status: 'Resolved' } },
    });
    const grid = buildHeatmapGrid([t1, t2]);
    expect(grid).not.toBeNull();

    const targetCell = grid!.cells[3].find((c) => c?.date === '2024-03-13');
    expect(targetCell!.dominantStatus).toBe('resolved');
  });

  it('generates all 12 month labels for full year grid', () => {
    const t1 = makeTicketWithDate('2024-01-15', { id: 't1' });
    const grid = buildHeatmapGrid([t1]);
    expect(grid).not.toBeNull();

    const labels = grid!.monthLabels.map((m) => m.label);
    // Full year should have all 12 months
    for (const month of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      expect(labels).toContain(month);
    }
    // Each label should have a valid weekIndex
    for (const ml of grid!.monthLabels) {
      expect(ml.weekIndex).toBeGreaterThanOrEqual(0);
      expect(ml.weekIndex).toBeLessThan(grid!.weekCount);
    }
  });
});
