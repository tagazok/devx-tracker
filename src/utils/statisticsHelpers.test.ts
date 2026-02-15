import { describe, it, expect } from 'vitest';
import { computeStatistics } from './statisticsHelpers';
import type { Ticket } from '../types/ticket';

/**
 * Helper to create a minimal Ticket for testing.
 */
function makeTicket(overrides: {
  status?: string;
  computedPendingReason?: string;
  labels?: string[];
  activityOrganizer?: string;
  attendees?: number;
} = {}): Ticket {
  return {
    title: 'Test Ticket',
    id: 'ticket-1',
    aliases: [],
    labels: overrides.labels ?? [],
    customFields: {
      string: overrides.activityOrganizer !== undefined
        ? [{ id: 'activity_organizer', value: overrides.activityOrganizer }]
        : [],
      date: [],
      boolean: [],
      number: overrides.attendees !== undefined
        ? [{ id: 'actual_audience_size_reached', value: overrides.attendees }]
        : [],
    },
    extensions: {
      tt: {
        status: overrides.status ?? 'Assigned',
        ...(overrides.computedPendingReason !== undefined && {
          computedPendingReason: overrides.computedPendingReason,
        }),
      },
    },
    description: '',
    descriptionContentType: 'text/plain',
  };
}

describe('computeStatistics', () => {
  /**
   * Validates: Requirement 5.2
   * WHEN the ticket array is empty, return zero counts for all statuses,
   * an empty label statistics list, and an empty cross-tabulation.
   */
  describe('empty ticket array', () => {
    it('returns statusCounts with all zeros', () => {
      const result = computeStatistics([]);
      expect(result.statusCounts).toEqual({ assigned: 0, accepted: 0, resolved: 0 });
    });

    it('returns empty labelStats', () => {
      const result = computeStatistics([]);
      expect(result.labelStats).toEqual([]);
    });

    it('returns empty organizerCross', () => {
      const result = computeStatistics([]);
      expect(result.organizerCross).toEqual([]);
    });

    it('returns empty organizerNames', () => {
      const result = computeStatistics([]);
      expect(result.organizerNames).toEqual([]);
    });
  });

  /**
   * Validates: Requirement 5.3
   * WHEN a ticket's labels contain strings, they are directly used in labelStats and organizerCross.
   */
  describe('tickets with labels', () => {
    it('includes labels in labelStats', () => {
      const tickets = [
        makeTicket({
          labels: ['DEU: Berlin', 'Theme: AI/ML'],
          attendees: 10,
        }),
      ];

      const result = computeStatistics(tickets);

      expect(result.labelStats.length).toBeGreaterThan(0);
      const berlinStat = result.labelStats.find(s => s.label === 'DEU: Berlin');
      expect(berlinStat).toBeDefined();
      expect(berlinStat?.ticketCount).toBe(1);
      expect(berlinStat?.totalAttendees).toBe(10);
    });

    it('includes labels in organizerCross', () => {
      const tickets = [
        makeTicket({
          labels: ['DEU: Berlin', 'Theme: AI/ML'],
          activityOrganizer: 'AWS Community',
        }),
      ];

      const result = computeStatistics(tickets);

      expect(result.organizerCross.length).toBeGreaterThan(0);
      const berlinCross = result.organizerCross.find(c => c.label === 'DEU: Berlin');
      expect(berlinCross).toBeDefined();
    });

    it('produces empty labelStats when tickets have no labels', () => {
      const tickets = [
        makeTicket({
          labels: [],
        }),
      ];

      const result = computeStatistics(tickets);

      expect(result.labelStats).toEqual([]);
      expect(result.organizerCross).toEqual([]);
    });

    it('still counts status correctly even when tickets have no labels', () => {
      const tickets = [
        makeTicket({
          status: 'Assigned',
          labels: [],
        }),
        makeTicket({
          status: 'Resolved',
          labels: [],
        }),
      ];

      const result = computeStatistics(tickets);

      expect(result.statusCounts).toEqual({ assigned: 1, accepted: 0, resolved: 1 });
    });
  });

  describe('important label filtering', () => {
    it('includes important labels in labelStats', () => {
      const tickets = [
        makeTicket({
          labels: ['Some Random Label', 'CFP_Accepted: Yes'],
        }),
      ];

      const result = computeStatistics(tickets);

      const cfpStat = result.labelStats.find(s => s.label === 'CFP_Accepted: Yes');
      expect(cfpStat).toBeDefined();
    });

    it('includes labels containing DEU:', () => {
      const tickets = [
        makeTicket({ labels: ['DEU: Munich'] }),
      ];

      const result = computeStatistics(tickets);

      const deuStat = result.labelStats.find(s => s.label === 'DEU: Munich');
      expect(deuStat).toBeDefined();
      expect(deuStat?.label).toBe('DEU: Munich');
    });
  });
});
