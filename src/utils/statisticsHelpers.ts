import type { Ticket, StatusCounts, LabelStat, OrganizerCrossRow, StatisticsData } from '../types/ticket';
import { groupByStatus } from './ticketFilters';
import { getCustomFieldString, getCustomFieldNumber } from './ticketHelpers';

const IMPORTANT_EXACT_LABELS = [
  'CFP_Accepted: Yes',
  'CFP_Submitted: Yes',
  'Segment: Students',
  'Program: re:Invent re:Cap',
];

/** Returns true if a label name should be included in statistics. */
export function isImportantLabel(name: string): boolean {
  return name.includes('DEU:') || IMPORTANT_EXACT_LABELS.includes(name);
}

/**
 * Computes aggregated statistics from all tickets.
 * Returns status counts, per-label statistics, and organizer cross-tabulation.
 * Only "important" labels are included: those containing "DEU:" or matching
 * specific exact names (CFP_Accepted, CFP_Submitted, Segment: Students, Program: re:Invent re:Cap).
 */
export function computeStatistics(tickets: Ticket[]): StatisticsData {
  // 1. Status counts via groupByStatus
  const groups = groupByStatus(tickets);
  const statusCounts: StatusCounts = {
    assigned: groups.assigned.length,
    accepted: groups.accepted.length,
    resolved: groups.resolved.length,
  };

  // 2. Build per-label accumulators and organizer cross-tab in a single pass
  const labelTicketCounts = new Map<string, number>();
  const labelAttendeeTotals = new Map<string, number>();
  const labelOrganizerCounts = new Map<string, Map<string, number>>();
  const organizerSet = new Set<string>();

  for (const ticket of tickets) {
    const resolvedNames = [...new Set(ticket.labels.filter(isImportantLabel))];
    if (resolvedNames.length === 0) continue;

    const attendees = getCustomFieldNumber(ticket, 'actual_audience_size_reached') ?? 0;
    const organizer = getCustomFieldString(ticket, 'activity_organizer') || 'Unknown';
    organizerSet.add(organizer);

    for (const name of resolvedNames) {
      labelTicketCounts.set(name, (labelTicketCounts.get(name) ?? 0) + 1);
      labelAttendeeTotals.set(name, (labelAttendeeTotals.get(name) ?? 0) + attendees);

      if (!labelOrganizerCounts.has(name)) {
        labelOrganizerCounts.set(name, new Map());
      }
      const orgMap = labelOrganizerCounts.get(name)!;
      orgMap.set(organizer, (orgMap.get(organizer) ?? 0) + 1);
    }
  }

  // 3. Build labelStats sorted alphabetically by label name
  const labelStats: LabelStat[] = Array.from(labelTicketCounts.entries())
    .map(([label, ticketCount]) => ({
      label,
      ticketCount,
      totalAttendees: labelAttendeeTotals.get(label) ?? 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // 4. Build organizerCross rows (same label order as labelStats)
  const organizerCross: OrganizerCrossRow[] = labelStats.map(({ label }) => {
    const orgMap = labelOrganizerCounts.get(label) ?? new Map<string, number>();
    const counts: Record<string, number> = Object.create(null);
    let total = 0;
    for (const [org, count] of orgMap) {
      counts[org] = count;
      total += count;
    }
    return { label, counts, total };
  });

  // 5. Sorted unique organizer names
  const organizerNames = Array.from(organizerSet).sort();

  return { statusCounts, labelStats, organizerCross, organizerNames };
}
