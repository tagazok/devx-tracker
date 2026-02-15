// Feature: ticket-viewer, Property 2: Status grouping correctness
// Feature: ticket-viewer, Property 3: All-tab filter is identity
// Feature: ticket-viewer, Property 4: Conference tab filter correctness
// Feature: ticket-viewer, Property 5: Students tab filter correctness
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterByTab, groupByStatus, filterByDateRange } from './ticketFilters';
import type { Ticket } from '../types/ticket';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const CFP_LABELS = ['CFP_Submitted: Yes', 'CFP_Accepted: Yes'];
const STUDENTS_LABEL = 'Segment: Students';

/** Arbitrary label string - includes CFP labels, Students label, and random labels. */
const labelArb = fc.oneof(
  fc.constant('CFP_Submitted: Yes'),
  fc.constant('CFP_Accepted: Yes'),
  fc.constant('Segment: Students'),
  fc.string({ minLength: 1, maxLength: 20 }),
);

/** Arbitrary status value — includes the three meaningful values plus random noise. */
const statusArb = fc.oneof(
  fc.constant('Assigned'),
  fc.constant('Resolved'),
  fc.constant('Pending'),
  fc.string({ minLength: 1, maxLength: 15 }),
);

/** Arbitrary computedPendingReason — includes 'Accepted' plus random noise. */
const pendingReasonArb = fc.oneof(
  fc.constant('Accepted'),
  fc.constant(undefined as string | undefined),
  fc.string({ minLength: 1, maxLength: 15 }),
);

/** Build a minimal Ticket with the given status, pendingReason, and labels. */
function buildTicket(
  status: string,
  pendingReason: string | undefined,
  labels: string[],
): Ticket {
  return {
    title: 'test',
    id: 'id',
    aliases: [],
    labels,
    customFields: { string: [], date: [], boolean: [], number: [] },
    extensions: {
      tt: {
        status,
        ...(pendingReason !== undefined ? { computedPendingReason: pendingReason } : {}),
      },
    },
    description: '',
    descriptionContentType: 'text/plain',
  };
}

/** Arbitrary for a Ticket with random status, pendingReason, and labels. */
const ticketArb: fc.Arbitrary<Ticket> = fc
  .tuple(statusArb, pendingReasonArb, fc.array(labelArb, { minLength: 0, maxLength: 5 }))
  .map(([status, reason, labels]) => buildTicket(status, reason, labels));

// ---------------------------------------------------------------------------
// Property 2: Status grouping correctness
// ---------------------------------------------------------------------------

describe('Property 2: Status grouping correctness', () => {
  // **Validates: Requirements 4.2, 4.3, 4.4**

  it('places every ticket in the correct group and no ticket in more than one group', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const { assigned, accepted, resolved } = groupByStatus(tickets);

          // Every ticket in assigned has status "Assigned"
          for (const t of assigned) {
            expect(t.extensions.tt.status).toBe('Assigned');
          }

          // Every ticket in accepted has computedPendingReason "Accepted"
          // and status is NOT "Assigned" (because Assigned takes priority)
          for (const t of accepted) {
            expect(t.extensions.tt.computedPendingReason).toBe('Accepted');
            expect(t.extensions.tt.status).not.toBe('Assigned');
          }

          // Every ticket in resolved has status "Resolved"
          // and is not Assigned and not Accepted-pending
          for (const t of resolved) {
            expect(t.extensions.tt.status).toBe('Resolved');
            expect(t.extensions.tt.computedPendingReason).not.toBe('Accepted');
          }

          // No ticket appears in more than one group
          const allGrouped = [...assigned, ...accepted, ...resolved];
          const uniqueSet = new Set(allGrouped);
          expect(uniqueSet.size).toBe(allGrouped.length);

          // Every input ticket that qualifies is in exactly one group
          for (const t of tickets) {
            const inAssigned = assigned.includes(t);
            const inAccepted = accepted.includes(t);
            const inResolved = resolved.includes(t);
            const count = [inAssigned, inAccepted, inResolved].filter(Boolean).length;
            expect(count).toBeLessThanOrEqual(1);

            // Verify placement matches the priority logic
            if (t.extensions.tt.status === 'Assigned') {
              expect(inAssigned).toBe(true);
            } else if (t.extensions.tt.computedPendingReason === 'Accepted') {
              expect(inAccepted).toBe(true);
            } else if (t.extensions.tt.status === 'Resolved') {
              expect(inResolved).toBe(true);
            } else {
              // Ticket doesn't match any group
              expect(count).toBe(0);
            }
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Property 3: All-tab filter is identity
// ---------------------------------------------------------------------------

describe('Property 3: All-tab filter is identity', () => {
  // **Validates: Requirements 5.1**

  it('filterByTab("all") returns an array identical to the input', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const result = filterByTab(tickets, 'all');
          expect(result).toEqual(tickets);
          expect(result.length).toBe(tickets.length);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('filterByTab("statistics") returns an array identical to the input', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const result = filterByTab(tickets, 'statistics');
          expect(result).toEqual(tickets);
          expect(result.length).toBe(tickets.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Conference tab filter correctness
// ---------------------------------------------------------------------------

describe('Property 4: Conference tab filter correctness', () => {
  // **Validates: Requirements 6.1**

  it('every returned ticket has a CFP label and no ticket without CFP labels is included', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const result = filterByTab(tickets, 'conferences');

          // Every ticket in the result has at least one CFP label
          for (const t of result) {
            const hasCfp = t.labels.some((name) => CFP_LABELS.includes(name));
            expect(hasCfp).toBe(true);
          }

          // No ticket lacking CFP labels should appear in the result
          for (const t of tickets) {
            const hasCfp = t.labels.some((name) => CFP_LABELS.includes(name));
            if (!hasCfp) {
              expect(result).not.toContain(t);
            }
          }

          // Result should contain exactly the tickets with CFP labels
          const expected = tickets.filter((t) => {
            return t.labels.some((name) => CFP_LABELS.includes(name));
          });
          expect(result.length).toBe(expected.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Students tab filter correctness
// ---------------------------------------------------------------------------

describe('Property 5: Students tab filter correctness', () => {
  // **Validates: Requirements 7.1**

  it('every returned ticket has the Students label and no ticket without it is included', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const result = filterByTab(tickets, 'students');

          // Every ticket in the result has the Students label
          for (const t of result) {
            expect(t.labels).toContain(STUDENTS_LABEL);
          }

          // No ticket lacking the Students label should appear in the result
          for (const t of tickets) {
            if (!t.labels.includes(STUDENTS_LABEL)) {
              expect(result).not.toContain(t);
            }
          }

          // Result should contain exactly the tickets with the Students label
          const expected = tickets.filter((t) => {
            return t.labels.includes(STUDENTS_LABEL);
          });
          expect(result.length).toBe(expected.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Feature: date-range-filter, Property 1: Date range filtering correctness
// ---------------------------------------------------------------------------

/** Arbitrary ISO date string (YYYY-MM-DD) in a reasonable range. */
const isoDateArb = fc
  .date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString().slice(0, 10));

/** Arbitrary date value for a ticket: either a valid ISO date or empty string. */
const ticketDateValueArb = fc.oneof(isoDateArb, fc.constant(''));

/** Build a ticket with a specific date custom field value. */
function buildTicketWithDate(dateValue: string): Ticket {
  return {
    title: 'test',
    id: 'id',
    aliases: [],
    labels: [],
    customFields: {
      string: [],
      date: dateValue !== ''
        ? [{ id: 'date', value: dateValue }]
        : [],
      boolean: [],
      number: [],
    },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: 'text/plain',
  };
}

/** Arbitrary ticket with a random date (or no date). */
const ticketWithDateArb: fc.Arbitrary<Ticket> = ticketDateValueArb.map(buildTicketWithDate);

/** Arbitrary start/end date pair where start ≤ end. */
const orderedDatePairArb: fc.Arbitrary<{ start: string; end: string }> = fc
  .tuple(isoDateArb, isoDateArb)
  .map(([a, b]) => (a <= b ? { start: a, end: b } : { start: b, end: a }));

describe('Property 1: Date range filtering correctness', () => {
  // **Validates: Requirements 2.1, 2.2, 2.3, 2.5, 5.1, 5.2**

  it('returns exactly the tickets whose non-empty date falls within [start, end]', () => {
    fc.assert(
      fc.property(
        fc.array(ticketWithDateArb, { minLength: 0, maxLength: 30 }),
        orderedDatePairArb,
        fc.constantFrom('both', 'startOnly', 'endOnly') as fc.Arbitrary<'both' | 'startOnly' | 'endOnly'>,
        (tickets, { start, end }, mode) => {
          const startArg = mode === 'endOnly' ? undefined : start;
          const endArg = mode === 'startOnly' ? undefined : end;

          const result = filterByDateRange(tickets, startArg, endArg);

          // Compute expected result manually
          const expected = tickets.filter((t) => {
            const dateField = t.customFields.date.find((f) => f.id === 'date');
            const date = dateField?.value ?? '';
            if (!date) return false;
            if (startArg && date < startArg) return false;
            if (endArg && date > endArg) return false;
            return true;
          });

          // Same length — no extra or missing tickets
          expect(result.length).toBe(expected.length);

          // Every returned ticket is in the expected set
          for (const t of result) {
            expect(expected).toContain(t);
          }

          // Every expected ticket is in the result
          for (const t of expected) {
            expect(result).toContain(t);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Feature: date-range-filter, Property 2: No bounds is identity
// ---------------------------------------------------------------------------

describe('Property 2: No bounds is identity', () => {
  // **Validates: Requirements 2.4**

  it('filterByDateRange(tickets, undefined, undefined) returns the input unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(ticketWithDateArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const result = filterByDateRange(tickets, undefined, undefined);
          expect(result).toEqual(tickets);
          expect(result.length).toBe(tickets.length);
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Feature: date-range-filter, Property 3: Invalid range returns empty
// ---------------------------------------------------------------------------

/** Arbitrary start/end date pair where start > end (invalid range). */
const invertedDatePairArb: fc.Arbitrary<{ start: string; end: string }> = fc
  .tuple(isoDateArb, isoDateArb)
  .filter(([a, b]) => a !== b)
  .map(([a, b]) => (a > b ? { start: a, end: b } : { start: b, end: a }));

describe('Property 3: Invalid range returns empty', () => {
  // **Validates: Requirements 5.3**

  it('returns an empty array when start > end', () => {
    fc.assert(
      fc.property(
        fc.array(ticketWithDateArb, { minLength: 0, maxLength: 30 }),
        invertedDatePairArb,
        (tickets, { start, end }) => {
          const result = filterByDateRange(tickets, start, end);
          expect(result).toEqual([]);
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Feature: date-range-filter, Property 4: AND composition with existing filters
// ---------------------------------------------------------------------------

import { getCustomFieldString } from './ticketHelpers';

/** Arbitrary organizer value: a small set of known names plus occasional empty. */
const organizerArb = fc.oneof(
  fc.constant('Alice'),
  fc.constant('Bob'),
  fc.constant('Charlie'),
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 10 }),
);

/** Build a ticket with both a date custom field and an activity_organizer string field. */
function buildTicketWithDateAndOrganizer(dateValue: string, organizer: string): Ticket {
  return {
    title: 'test',
    id: 'id',
    aliases: [],
    labels: [],
    customFields: {
      string: organizer !== '' ? [{ id: 'activity_organizer', value: organizer }] : [],
      date: dateValue !== '' ? [{ id: 'date', value: dateValue }] : [],
      boolean: [],
      number: [],
    },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: 'text/plain',
  };
}

/** Arbitrary ticket with random date and random organizer. */
const ticketWithDateAndOrgArb: fc.Arbitrary<Ticket> = fc
  .tuple(ticketDateValueArb, organizerArb)
  .map(([d, o]) => buildTicketWithDateAndOrganizer(d, o));

describe('Property 4: AND composition with existing filters', () => {
  // **Validates: Requirements 3.1**

  it('combined date + organizer filter equals intersection of each filter applied alone', () => {
    fc.assert(
      fc.property(
        fc.array(ticketWithDateAndOrgArb, { minLength: 0, maxLength: 30 }),
        orderedDatePairArb,
        organizerArb.filter((o) => o !== ''),
        (tickets, { start, end }, selectedOrganizer) => {
          // Apply date filter alone
          const dateOnly = filterByDateRange(tickets, start, end);

          // Apply organizer filter alone
          const orgOnly = tickets.filter(
            (t) => getCustomFieldString(t, 'activity_organizer') === selectedOrganizer,
          );

          // Apply both filters combined (date first, then organizer — order shouldn't matter)
          const combined = filterByDateRange(tickets, start, end).filter(
            (t) => getCustomFieldString(t, 'activity_organizer') === selectedOrganizer,
          );

          // Combined result must be a subset of date-only result
          for (const t of combined) {
            expect(dateOnly).toContain(t);
          }

          // Combined result must be a subset of organizer-only result
          for (const t of combined) {
            expect(orgOnly).toContain(t);
          }

          // Every ticket passing both individual filters must be in the combined result
          const intersection = tickets.filter(
            (t) => dateOnly.includes(t) && orgOnly.includes(t),
          );
          expect(combined.length).toBe(intersection.length);
          for (const t of intersection) {
            expect(combined).toContain(t);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});


// ---------------------------------------------------------------------------
// Feature: heatmap-click-filter, Property 3: Single-day filter returns exact date matches
// ---------------------------------------------------------------------------

describe('Feature: heatmap-click-filter, Property 3: Single-day filter returns exact date matches', () => {
  // **Validates: Requirements 1.4**

  it('filterByDateRange(tickets, date, date) returns exactly the tickets whose date matches', () => {
    fc.assert(
      fc.property(
        fc.array(ticketWithDateArb, { minLength: 0, maxLength: 30 }),
        isoDateArb,
        (tickets, date) => {
          const result = filterByDateRange(tickets, date, date);

          // Compute expected: tickets whose date custom field exactly equals the target date
          const expected = tickets.filter((t) => {
            const dateField = t.customFields.date.find((f) => f.id === 'date');
            const dateValue = dateField?.value ?? '';
            return dateValue === date;
          });

          // Same length — no extra or missing tickets
          expect(result.length).toBe(expected.length);

          // Every returned ticket has the exact matching date
          for (const t of result) {
            const dateField = t.customFields.date.find((f) => f.id === 'date');
            expect(dateField?.value).toBe(date);
          }

          // Every expected ticket is in the result
          for (const t of expected) {
            expect(result).toContain(t);
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});
