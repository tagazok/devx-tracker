// Feature: statistics-tab, Property 1: Status counts match groupByStatus
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeStatistics, isImportantLabel } from './statisticsHelpers';
import { groupByStatus } from './ticketFilters';
import { getCustomFieldNumber, getCustomFieldString } from './ticketHelpers';
import type { Ticket, CustomFieldString } from '../types/ticket';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Arbitrary label string - includes important and non-important labels. */
const labelArb = fc.oneof(
  fc.constant('CFP_Accepted: Yes'),
  fc.constant('CFP_Submitted: Yes'),
  fc.constant('Segment: Students'),
  fc.constant('Program: re:Invent re:Cap'),
  fc.string({ minLength: 1, maxLength: 15 }).map((s) => `DEU:${s}`),
  fc.string({ minLength: 1, maxLength: 20 }), // non-important label
);

/** Arbitrary status value — includes the three meaningful values plus random noise. */
const statusArb = fc.oneof(
  fc.constant('Assigned'),
  fc.constant('Resolved'),
  fc.constant('Pending'),
  fc.string({ minLength: 1, maxLength: 15 }),
);

/** Arbitrary computedPendingReason — includes 'Accepted' plus random noise and undefined. */
const pendingReasonArb = fc.oneof(
  fc.constant('Accepted'),
  fc.constant(undefined as string | undefined),
  fc.string({ minLength: 1, maxLength: 15 }),
);

/** Arbitrary activity_organizer custom field string entry (or absent). */
const activityOrganizerArb: fc.Arbitrary<CustomFieldString[]> = fc.oneof(
  fc.constant([] as CustomFieldString[]),
  fc.string({ minLength: 1, maxLength: 20 }).map((v) => [{ id: 'activity_organizer', value: v }]),
);

/** Arbitrary actual_audience_size_reached custom field number entry (or absent). */
const audienceSizeArb: fc.Arbitrary<{ id: string; value: number }[]> = fc.oneof(
  fc.constant([] as { id: string; value: number }[]),
  fc.integer({ min: 0, max: 10000 }).map((v) => [{ id: 'actual_audience_size_reached', value: v }]),
);

/** Build a Ticket with random status, pendingReason, labels, and custom fields. */
function buildTicket(
  status: string,
  pendingReason: string | undefined,
  labels: string[],
  orgFields: CustomFieldString[],
  audienceFields: { id: string; value: number }[],
): Ticket {
  return {
    title: 'test',
    id: 'id',
    aliases: [],
    labels,
    customFields: {
      string: orgFields,
      date: [],
      boolean: [],
      number: audienceFields,
    },
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

/** Arbitrary for a Ticket with random status, pendingReason, labels, and custom fields. */
const ticketArb: fc.Arbitrary<Ticket> = fc
  .tuple(
    statusArb,
    pendingReasonArb,
    fc.array(labelArb, { minLength: 0, maxLength: 5 }),
    activityOrganizerArb,
    audienceSizeArb,
  )
  .map(([status, reason, labels, orgFields, audienceFields]) =>
    buildTicket(status, reason, labels, orgFields, audienceFields),
  );

// ---------------------------------------------------------------------------
// Property 1: Status counts match groupByStatus
// ---------------------------------------------------------------------------

describe('Property 1: Status counts match groupByStatus', () => {
  // **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  it('statusCounts from computeStatistics match the lengths of groupByStatus arrays', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const stats = computeStatistics(tickets);
          const groups = groupByStatus(tickets);

          expect(stats.statusCounts.assigned).toBe(groups.assigned.length);
          expect(stats.statusCounts.accepted).toBe(groups.accepted.length);
          expect(stats.statusCounts.resolved).toBe(groups.resolved.length);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: Label statistics correctness
// ---------------------------------------------------------------------------

describe('Property 2: Label statistics correctness', () => {
  // **Validates: Requirements 3.1, 3.2, 3.3**

  it('each LabelStat row has correct ticketCount and totalAttendees, and the label set matches important labels across all tickets', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const stats = computeStatistics(tickets);

          // Independently compute expected label → tickets mapping (only important labels)
          const expectedTicketsByLabel = new Map<string, Ticket[]>();
          for (const ticket of tickets) {
            const importantLabels = [...new Set(ticket.labels.filter(isImportantLabel))];
            for (const name of importantLabels) {
              if (!expectedTicketsByLabel.has(name)) {
                expectedTicketsByLabel.set(name, []);
              }
              expectedTicketsByLabel.get(name)!.push(ticket);
            }
          }

          // The set of label names in output should match the set of important labels
          const expectedLabelNames = new Set(expectedTicketsByLabel.keys());
          const actualLabelNames = new Set(stats.labelStats.map((s) => s.label));
          expect(actualLabelNames).toEqual(expectedLabelNames);

          // For each LabelStat row, verify ticketCount and totalAttendees
          for (const row of stats.labelStats) {
            const matchingTickets = expectedTicketsByLabel.get(row.label) ?? [];

            expect(row.ticketCount).toBe(matchingTickets.length);

            const expectedAttendees = matchingTickets.reduce((sum, t) => {
              return sum + (getCustomFieldNumber(t, 'actual_audience_size_reached') ?? 0);
            }, 0);
            expect(row.totalAttendees).toBe(expectedAttendees);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Label statistics sort order
// ---------------------------------------------------------------------------

describe('Property 3: Label statistics sort order', () => {
  // **Validates: Requirements 3.4**

  it('labelStats should be sorted alphabetically by label name', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const stats = computeStatistics(tickets);

          for (let i = 0; i < stats.labelStats.length - 1; i++) {
            expect(
              stats.labelStats[i].label.localeCompare(stats.labelStats[i + 1].label),
            ).toBeLessThanOrEqual(0);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Cross-tabulation cell correctness
// ---------------------------------------------------------------------------

describe('Property 4: Cross-tabulation cell correctness', () => {
  // **Validates: Requirements 4.1, 4.2, 4.3**

  it('each OrganizerCrossRow cell count equals the number of tickets with both that label and that organizer', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const stats = computeStatistics(tickets);

          for (const row of stats.organizerCross) {
            for (const organizer of stats.organizerNames) {
              // Independently count tickets that have both this important label and this organizer
              const expectedCount = tickets.filter((ticket) => {
                const importantLabels = [...new Set(ticket.labels.filter(isImportantLabel))];
                if (!importantLabels.includes(row.label)) return false;
                const ticketOrganizer = getCustomFieldString(ticket, 'activity_organizer') || 'Unknown';
                return ticketOrganizer === organizer;
              }).length;

              const actualCount = row.counts[organizer] ?? 0;
              expect(actualCount).toBe(expectedCount);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Cross-tabulation total consistency
// ---------------------------------------------------------------------------

describe('Property 5: Cross-tabulation total consistency', () => {
  // **Validates: Requirements 4.4**

  it('each OrganizerCrossRow total equals the sum of all values in row.counts', () => {
    fc.assert(
      fc.property(
        fc.array(ticketArb, { minLength: 0, maxLength: 30 }),
        (tickets) => {
          const stats = computeStatistics(tickets);

          for (const row of stats.organizerCross) {
            const sumOfCounts = Object.values(row.counts).reduce((sum, count) => sum + count, 0);
            expect(row.total).toBe(sumOfCounts);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
