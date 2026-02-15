import type { Ticket } from '../types/ticket';

export type CfpStatus = 'accepted' | 'submitted' | 'none';

export const CFP_SUBMITTED_LABEL = 'CFP_Submitted: Yes';
export const CFP_ACCEPTED_LABEL = 'CFP_Accepted: Yes';

/**
 * Determines the CFP (Call for Papers) status from a ticket's labels.
 * "accepted" takes priority over "submitted" when both are present.
 */
export function getCfpStatus(ticket: Ticket): CfpStatus {
  if (ticket.labels.includes(CFP_ACCEPTED_LABEL)) return 'accepted';
  if (ticket.labels.includes(CFP_SUBMITTED_LABEL)) return 'submitted';
  return 'none';
}

/**
 * Returns true if the value is a usable URL — i.e. non-empty and not "NA".
 */
export function isNonEmptyUrl(value: string): boolean {
  return value !== '' && value !== 'NA';
}


/**
 * Extracts the alias from a kerberos identity string.
 * e.g. "kerberos:oleplus@ANT.AMAZON.COM" → "oleplus"
 * Returns empty string if the format doesn't match.
 */
export function getAssigneeAlias(ticket: Ticket): string {
  const identity = ticket.assigneeIdentity ?? '';
  const match = identity.match(/^kerberos:([^@]+)@/);
  return match?.[1] ?? '';
}

/**
 * Searches customFields.string for a matching id and returns its value.
 * Returns empty string if not found.
 */
export function getCustomFieldString(ticket: Ticket, fieldId: string): string {
  const field = ticket.customFields.string?.find((f) => f.id === fieldId);
  return field?.value ?? '';
}

/**
 * Searches customFields.date for a matching id and returns its value.
 * Returns empty string if not found.
 */
export function getCustomFieldDate(ticket: Ticket, fieldId: string): string {
  const field = ticket.customFields.date?.find((f) => f.id === fieldId);
  return field?.value ?? '';
}

/**
 * Searches customFields.number for a matching id and returns its value.
 * Returns null if not found.
 */
export function getCustomFieldNumber(ticket: Ticket, fieldId: string): number | null {
  const field = ticket.customFields.number?.find((f) => f.id === fieldId);
  return field?.value ?? null;
}

/**
 * Finds the alias starting with "D" in the ticket's aliases array.
 * Returns the alias id or null if none found.
 */
export function getTicketId(ticket: Ticket): string | null {
  const alias = ticket.aliases.find((a) => a.id.startsWith('D'));
  return alias?.id ?? null;
}

/**
 * Returns a SIM link for the ticket, or null if no D-alias exists.
 */
export function getSimLink(ticket: Ticket): string | null {
  const ticketId = getTicketId(ticket);
  return ticketId ? `https://sim.amazon.com/issues/${ticketId}` : null;
}

/**
 * Sorts tickets by date.
 * @param order 'asc' for oldest first, 'desc' for newest first.
 * Tickets without a date are placed at the end.
 */
export function sortByDate(tickets: Ticket[], order: 'asc' | 'desc' = 'asc'): Ticket[] {
  return [...tickets].sort((a, b) => {
    const dateA = getCustomFieldDate(a, 'date');
    const dateB = getCustomFieldDate(b, 'date');
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return order === 'desc'
      ? dateB.localeCompare(dateA)
      : dateA.localeCompare(dateB);
  });
}

/** @deprecated Use sortByDate(tickets, 'desc') instead */
export function sortByDateDesc(tickets: Ticket[]): Ticket[] {
  return sortByDate(tickets, 'desc');
}

/**
 * Groups sorted tickets by month. Returns an array of { label, tickets } objects.
 * Expects tickets to already be sorted by date descending.
 */
export function groupByMonth(tickets: Ticket[]): { label: string; tickets: Ticket[] }[] {
  const groups: { label: string; tickets: Ticket[] }[] = [];
  let currentLabel = '';

  for (const ticket of tickets) {
    const dateStr = getCustomFieldDate(ticket, 'date');
    let label = 'No date';
    if (dateStr) {
      const d = new Date(dateStr);
      label = d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    }

    if (label !== currentLabel) {
      groups.push({ label, tickets: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].tickets.push(ticket);
  }

  return groups;
}
