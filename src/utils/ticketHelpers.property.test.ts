// Feature: ticket-viewer, Property 1: CFP status correctness
// Feature: ticket-viewer, Property 6: SIM link construction
// Feature: ticket-viewer, Property 7: Custom field extraction
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getSimLink,
  getTicketId,
  getCustomFieldString,
  getCustomFieldDate,
  getCfpStatus,
  isNonEmptyUrl,
  CFP_SUBMITTED_LABEL,
  CFP_ACCEPTED_LABEL,
} from './ticketHelpers';
import type { Ticket, TicketAlias, CustomFieldString, CustomFieldDate } from '../types/ticket';

/**
 * Arbitrary for a TicketAlias whose id does NOT start with 'D'.
 */
const nonDaliasArb: fc.Arbitrary<TicketAlias> = fc.record({
  precedence: fc.string({ minLength: 1, maxLength: 10 }),
  id: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.startsWith('D')),
});

/**
 * Arbitrary for a TicketAlias whose id starts with 'D'.
 */
const dAliasArb: fc.Arbitrary<TicketAlias> = fc.record({
  precedence: fc.string({ minLength: 1, maxLength: 10 }),
  id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => 'D' + s),
});

/**
 * Arbitrary for a CustomFieldString entry.
 */
const customFieldStringArb: fc.Arbitrary<CustomFieldString> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  value: fc.string({ minLength: 0, maxLength: 100 }),
});

/**
 * Arbitrary for a CustomFieldDate entry.
 */
const customFieldDateArb: fc.Arbitrary<CustomFieldDate> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  value: fc.string({ minLength: 0, maxLength: 30 }),
});

/**
 * Build a Ticket from the given aliases and custom fields.
 */
function buildTicket(
  aliases: TicketAlias[],
  stringFields: CustomFieldString[] = [],
  dateFields: CustomFieldDate[] = [],
): Ticket {
  return {
    title: 'test',
    id: 'id',
    aliases,
    labels: [],
    customFields: {
      string: stringFields,
      date: dateFields,
      boolean: [],
      number: [],
    },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: 'text/plain',
  };
}

describe('Property 6: SIM link construction', () => {
  // **Validates: Requirements 8.7, 8.8**

  it('returns a SIM link using the first D-alias when at least one exists', () => {
    fc.assert(
      fc.property(
        fc.array(nonDaliasArb, { minLength: 0, maxLength: 10 }),
        dAliasArb,
        fc.array(
          fc.oneof(nonDaliasArb, dAliasArb),
          { minLength: 0, maxLength: 10 },
        ),
        (before: TicketAlias[], dAlias: TicketAlias, after: TicketAlias[]) => {
          const aliases = [...before, dAlias, ...after];
          const ticket = buildTicket(aliases);
          const result = getSimLink(ticket);

          // The first D-alias in the array determines the link
          const firstD = aliases.find((a) => a.id.startsWith('D'))!;
          expect(result).toBe(`https://sim.amazon.com/issues/${firstD.id}`);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('returns null when no alias starts with D', () => {
    fc.assert(
      fc.property(
        fc.array(nonDaliasArb, { minLength: 0, maxLength: 20 }),
        (aliases: TicketAlias[]) => {
          const ticket = buildTicket(aliases);
          expect(getSimLink(ticket)).toBeNull();
        },
      ),
      { numRuns: 200 },
    );
  });

  it('getTicketId returns the first D-alias id or null', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(nonDaliasArb, dAliasArb), { minLength: 0, maxLength: 20 }),
        (aliases: TicketAlias[]) => {
          const ticket = buildTicket(aliases);
          const firstD = aliases.find((a) => a.id.startsWith('D'));
          if (firstD) {
            expect(getTicketId(ticket)).toBe(firstD.id);
          } else {
            expect(getTicketId(ticket)).toBeNull();
          }
        },
      ),
      { numRuns: 200 },
    );
  });
});

describe('Property 7: Custom field extraction', () => {
  // **Validates: Requirements 9.1, 9.2, 9.3**

  it('getCustomFieldString returns the value when the field id exists in customFields.string', () => {
    fc.assert(
      fc.property(
        fc.array(customFieldStringArb, { minLength: 1, maxLength: 20 }),
        fc.nat().chain((n) =>
          fc.constant(n),
        ),
        (fields: CustomFieldString[], idx: number) => {
          const target = fields[idx % fields.length];
          const ticket = buildTicket([], fields);
          // find should return the first match, same as the implementation
          const firstMatch = fields.find((f) => f.id === target.id)!;
          expect(getCustomFieldString(ticket, target.id)).toBe(firstMatch.value);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('getCustomFieldString returns empty string when field id is not found', () => {
    fc.assert(
      fc.property(
        fc.array(customFieldStringArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (fields: CustomFieldString[], searchId: string) => {
          // Ensure searchId is not in the fields
          const safeId = fields.some((f) => f.id === searchId)
            ? searchId + '_NOTFOUND'
            : searchId;
          // Double-check it's truly absent
          fc.pre(!fields.some((f) => f.id === safeId));
          const ticket = buildTicket([], fields);
          expect(getCustomFieldString(ticket, safeId)).toBe('');
        },
      ),
      { numRuns: 200 },
    );
  });

  it('getCustomFieldDate returns the value when the field id exists in customFields.date', () => {
    fc.assert(
      fc.property(
        fc.array(customFieldDateArb, { minLength: 1, maxLength: 20 }),
        fc.nat().chain((n) =>
          fc.constant(n),
        ),
        (fields: CustomFieldDate[], idx: number) => {
          const target = fields[idx % fields.length];
          const ticket = buildTicket([], [], fields);
          const firstMatch = fields.find((f) => f.id === target.id)!;
          expect(getCustomFieldDate(ticket, target.id)).toBe(firstMatch.value);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('getCustomFieldDate returns empty string when field id is not found', () => {
    fc.assert(
      fc.property(
        fc.array(customFieldDateArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 30 }),
        (fields: CustomFieldDate[], searchId: string) => {
          const safeId = fields.some((f) => f.id === searchId)
            ? searchId + '_NOTFOUND'
            : searchId;
          fc.pre(!fields.some((f) => f.id === safeId));
          const ticket = buildTicket([], [], fields);
          expect(getCustomFieldDate(ticket, safeId)).toBe('');
        },
      ),
      { numRuns: 200 },
    );
  });
});


/**
 * Arbitrary for a label string that is NOT one of the CFP labels.
 */
const nonCfpLabelArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((s) => s !== CFP_SUBMITTED_LABEL && s !== CFP_ACCEPTED_LABEL);

/**
 * Build a Ticket with the given labels (reuses the existing buildTicket helper shape).
 */
function buildTicketWithLabels(labels: string[]): Ticket {
  return {
    title: 'test',
    id: 'id',
    aliases: [],
    labels,
    customFields: { string: [], date: [], boolean: [], number: [] },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: '',
  };
}

describe('Property 1: CFP status correctness', () => {
  // **Validates: Requirements 3.1, 3.2, 3.3, 7.1, 7.2, 7.3, 7.4**

  it('returns "accepted" when the accepted label is present, regardless of other labels', () => {
    fc.assert(
      fc.property(
        fc.array(nonCfpLabelArb, { minLength: 0, maxLength: 10 }),
        fc.boolean(), // whether to also include the submitted label
        (otherLabels, includeSubmitted) => {
          const labels = [...otherLabels, CFP_ACCEPTED_LABEL];
          if (includeSubmitted) labels.push(CFP_SUBMITTED_LABEL);
          // Shuffle to ensure order doesn't matter
          const ticket = buildTicketWithLabels(fc.sample(fc.shuffledSubarray(labels, { minLength: labels.length, maxLength: labels.length }), 1)[0]);
          expect(getCfpStatus(ticket)).toBe('accepted');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns "submitted" when only the submitted label is present (no accepted)', () => {
    fc.assert(
      fc.property(
        fc.array(nonCfpLabelArb, { minLength: 0, maxLength: 10 }),
        (otherLabels) => {
          const labels = [...otherLabels, CFP_SUBMITTED_LABEL];
          const ticket = buildTicketWithLabels(fc.sample(fc.shuffledSubarray(labels, { minLength: labels.length, maxLength: labels.length }), 1)[0]);
          expect(getCfpStatus(ticket)).toBe('submitted');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns "none" when neither CFP label is present', () => {
    fc.assert(
      fc.property(
        fc.array(nonCfpLabelArb, { minLength: 0, maxLength: 10 }),
        (labels) => {
          const ticket = buildTicketWithLabels(labels);
          expect(getCfpStatus(ticket)).toBe('none');
        },
      ),
      { numRuns: 100 },
    );
  });
});


describe('Property 3: "NA" URL filtering', () => {
  // **Validates: Requirements 4.2, 4.3**

  it('returns false for empty string and "NA"', () => {
    expect(isNonEmptyUrl('')).toBe(false);
    expect(isNonEmptyUrl('NA')).toBe(false);
  });

  it('returns true for any non-empty string that is not "NA"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s !== 'NA'),
        (value: string) => {
          expect(isNonEmptyUrl(value)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns false only for "" and "NA"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 200 }),
        (value: string) => {
          const result = isNonEmptyUrl(value);
          if (value === '' || value === 'NA') {
            expect(result).toBe(false);
          } else {
            expect(result).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
