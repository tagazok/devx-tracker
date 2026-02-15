import { describe, it, expect } from 'vitest';
import { filterByTab, groupByStatus } from './ticketFilters';
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

describe('filterByTab', () => {
  it('returns all tickets for "all" tab', () => {
    const tickets = [makeTicket({ id: '1' }), makeTicket({ id: '2' })];
    expect(filterByTab(tickets, 'all')).toEqual(tickets);
  });

  it('returns empty array for "all" tab with no tickets', () => {
    expect(filterByTab([], 'all')).toEqual([]);
  });

  it('returns all tickets for "statistics" tab', () => {
    const tickets = [makeTicket({ id: '1' }), makeTicket({ id: '2' })];
    expect(filterByTab(tickets, 'statistics')).toEqual(tickets);
  });

  it('returns empty array for "statistics" tab with no tickets', () => {
    expect(filterByTab([], 'statistics')).toEqual([]);
  });

  it('filters by CFP labels for "conferences" tab', () => {
    const cfpTicket = makeTicket({
      id: '1',
      labels: ['CFP_Submitted: Yes', 'GEO: EMEA'],
    });
    const otherTicket = makeTicket({
      id: '2',
      labels: ['Theme: AI/ML'],
    });
    const result = filterByTab([cfpTicket, otherTicket], 'conferences');
    expect(result).toEqual([cfpTicket]);
  });

  it('includes tickets with CFP_Accepted label for "conferences" tab', () => {
    const ticket = makeTicket({
      labels: ['CFP_Accepted: Yes', 'GEO: EMEA'],
    });
    const result = filterByTab([ticket], 'conferences');
    expect(result).toEqual([ticket]);
  });

  it('filters by "Segment: Students" for "students" tab', () => {
    const studentTicket = makeTicket({
      id: '1',
      labels: ['Segment: Students', 'GEO: EMEA'],
    });
    const otherTicket = makeTicket({
      id: '2',
      labels: ['Theme: AI/ML'],
    });
    const result = filterByTab([studentTicket, otherTicket], 'students');
    expect(result).toEqual([studentTicket]);
  });

  it('returns empty array when no tickets match "conferences"', () => {
    const ticket = makeTicket({
      labels: ['Theme: AI/ML'],
    });
    expect(filterByTab([ticket], 'conferences')).toEqual([]);
  });

  it('returns empty array when no tickets match "students"', () => {
    const ticket = makeTicket({
      labels: ['Theme: AI/ML'],
    });
    expect(filterByTab([ticket], 'students')).toEqual([]);
  });

  it('returns all tickets for an unknown tab', () => {
    const tickets = [makeTicket()];
    expect(filterByTab(tickets, 'unknown')).toEqual(tickets);
  });
});

describe('groupByStatus', () => {
  it('groups assigned tickets', () => {
    const ticket = makeTicket({ extensions: { tt: { status: 'Assigned' } } });
    const result = groupByStatus([ticket]);
    expect(result.assigned).toEqual([ticket]);
    expect(result.accepted).toEqual([]);
    expect(result.resolved).toEqual([]);
  });

  it('groups accepted tickets by computedPendingReason', () => {
    const ticket = makeTicket({
      extensions: { tt: { status: 'Pending', computedPendingReason: 'Accepted' } },
    });
    const result = groupByStatus([ticket]);
    expect(result.assigned).toEqual([]);
    expect(result.accepted).toEqual([ticket]);
    expect(result.resolved).toEqual([]);
  });

  it('groups resolved tickets', () => {
    const ticket = makeTicket({ extensions: { tt: { status: 'Resolved' } } });
    const result = groupByStatus([ticket]);
    expect(result.assigned).toEqual([]);
    expect(result.accepted).toEqual([]);
    expect(result.resolved).toEqual([ticket]);
  });

  it('handles mixed statuses', () => {
    const assigned = makeTicket({ id: '1', extensions: { tt: { status: 'Assigned' } } });
    const accepted = makeTicket({
      id: '2',
      extensions: { tt: { status: 'Pending', computedPendingReason: 'Accepted' } },
    });
    const resolved = makeTicket({ id: '3', extensions: { tt: { status: 'Resolved' } } });

    const result = groupByStatus([assigned, accepted, resolved]);
    expect(result.assigned).toEqual([assigned]);
    expect(result.accepted).toEqual([accepted]);
    expect(result.resolved).toEqual([resolved]);
  });

  it('excludes tickets that match no group', () => {
    const ticket = makeTicket({
      extensions: { tt: { status: 'Unknown' } },
    });
    const result = groupByStatus([ticket]);
    expect(result.assigned).toEqual([]);
    expect(result.accepted).toEqual([]);
    expect(result.resolved).toEqual([]);
  });

  it('returns empty groups for empty input', () => {
    const result = groupByStatus([]);
    expect(result).toEqual({ assigned: [], accepted: [], resolved: [] });
  });

  it('prioritizes status over computedPendingReason for Assigned', () => {
    const ticket = makeTicket({
      extensions: { tt: { status: 'Assigned', computedPendingReason: 'Accepted' } },
    });
    const result = groupByStatus([ticket]);
    expect(result.assigned).toEqual([ticket]);
    expect(result.accepted).toEqual([]);
  });
});
