import { describe, it, expect } from 'vitest';
import {
  getCustomFieldString,
  getCustomFieldDate,
  getTicketId,
  getSimLink,
  getCfpStatus,
  isNonEmptyUrl,
  CFP_SUBMITTED_LABEL,
  CFP_ACCEPTED_LABEL,
} from './ticketHelpers';
import type { Ticket } from '../types/ticket';

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    title: 'Test Ticket',
    id: 'ticket-1',
    aliases: [],
    labels: [],
    description: '',
    descriptionContentType: '',
    customFields: {
      string: [],
      date: [],
      boolean: [],
      number: [],
    },
    extensions: { tt: { status: 'Assigned' } },
    ...overrides,
  };
}

describe('getCustomFieldString', () => {
  it('returns value when field id matches', () => {
    const ticket = makeTicket({
      customFields: {
        string: [{ id: 'city', value: 'Seattle' }, { id: 'country', value: 'US' }],
        date: [],
        boolean: [],
        number: [],
      },
    });
    expect(getCustomFieldString(ticket, 'city')).toBe('Seattle');
    expect(getCustomFieldString(ticket, 'country')).toBe('US');
  });

  it('returns empty string when field id not found', () => {
    const ticket = makeTicket();
    expect(getCustomFieldString(ticket, 'nonexistent')).toBe('');
  });

  it('returns first match when duplicates exist', () => {
    const ticket = makeTicket({
      customFields: {
        string: [{ id: 'city', value: 'First' }, { id: 'city', value: 'Second' }],
        date: [],
        boolean: [],
        number: [],
      },
    });
    expect(getCustomFieldString(ticket, 'city')).toBe('First');
  });
});

describe('getCustomFieldDate', () => {
  it('returns value when date field matches', () => {
    const ticket = makeTicket({
      customFields: {
        string: [],
        date: [{ id: 'date', value: '2024-06-15' }],
        boolean: [],
        number: [],
      },
    });
    expect(getCustomFieldDate(ticket, 'date')).toBe('2024-06-15');
  });

  it('returns empty string when date field not found', () => {
    const ticket = makeTicket();
    expect(getCustomFieldDate(ticket, 'date')).toBe('');
  });
});

describe('getTicketId', () => {
  it('returns alias id starting with D', () => {
    const ticket = makeTicket({
      aliases: [
        { precedence: 'low', id: 'A123' },
        { precedence: 'high', id: 'D391475696' },
      ],
    });
    expect(getTicketId(ticket)).toBe('D391475696');
  });

  it('returns null when no D-alias exists', () => {
    const ticket = makeTicket({
      aliases: [{ precedence: 'low', id: 'A123' }],
    });
    expect(getTicketId(ticket)).toBeNull();
  });

  it('returns null for empty aliases', () => {
    const ticket = makeTicket();
    expect(getTicketId(ticket)).toBeNull();
  });

  it('returns first D-alias when multiple exist', () => {
    const ticket = makeTicket({
      aliases: [
        { precedence: 'high', id: 'D111' },
        { precedence: 'low', id: 'D222' },
      ],
    });
    expect(getTicketId(ticket)).toBe('D111');
  });
});

describe('getSimLink', () => {
  it('returns SIM link when D-alias exists', () => {
    const ticket = makeTicket({
      aliases: [{ precedence: 'high', id: 'D391475696' }],
    });
    expect(getSimLink(ticket)).toBe('https://sim.amazon.com/issues/D391475696');
  });

  it('returns null when no D-alias exists', () => {
    const ticket = makeTicket({
      aliases: [{ precedence: 'low', id: 'A123' }],
    });
    expect(getSimLink(ticket)).toBeNull();
  });

  it('returns null for empty aliases', () => {
    const ticket = makeTicket();
    expect(getSimLink(ticket)).toBeNull();
  });
});


describe('getCfpStatus', () => {
  it('returns "accepted" when ticket has the CFP accepted label', () => {
    const ticket = makeTicket({
      labels: [CFP_ACCEPTED_LABEL],
    });
    expect(getCfpStatus(ticket)).toBe('accepted');
  });

  it('returns "submitted" when ticket has the CFP submitted label', () => {
    const ticket = makeTicket({
      labels: [CFP_SUBMITTED_LABEL],
    });
    expect(getCfpStatus(ticket)).toBe('submitted');
  });

  it('returns "accepted" when ticket has both CFP labels (accepted takes priority)', () => {
    const ticket = makeTicket({
      labels: [CFP_SUBMITTED_LABEL, CFP_ACCEPTED_LABEL],
    });
    expect(getCfpStatus(ticket)).toBe('accepted');
  });

  it('returns "none" when ticket has no CFP labels', () => {
    const ticket = makeTicket({
      labels: ['GEO: EMEA', 'Theme: AI/ML'],
    });
    expect(getCfpStatus(ticket)).toBe('none');
  });

  it('returns "none" when ticket has empty labels', () => {
    const ticket = makeTicket();
    expect(getCfpStatus(ticket)).toBe('none');
  });
});


describe('isNonEmptyUrl', () => {
  it('returns false for empty string', () => {
    expect(isNonEmptyUrl('')).toBe(false);
  });

  it('returns false for "NA"', () => {
    expect(isNonEmptyUrl('NA')).toBe(false);
  });

  it('returns true for a valid URL string', () => {
    expect(isNonEmptyUrl('https://example.com')).toBe(true);
  });

  it('returns true for arbitrary non-empty, non-NA strings', () => {
    expect(isNonEmptyUrl('some-value')).toBe(true);
  });
});
