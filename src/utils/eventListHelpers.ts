import type { RawMeetupEvent } from '../types/meetup'

export interface DisplayEvent {
  id: string
  title: string
  descriptionPreview: string
  dateFormatted: string
  dateTime: string
  eventUrl: string
  rsvpCount: number
}

export interface CategorizedEvents {
  upcoming: DisplayEvent[]
  past: DisplayEvent[]
}

/**
 * Truncate a description to maxLength characters without splitting words.
 * Appends "…" (unicode ellipsis) if truncated.
 * Returns empty string as-is without ellipsis.
 */
export function truncateDescription(description: string, maxLength: number = 150): string {
  if (description.length <= maxLength) {
    return description
  }

  const truncated = description.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace <= 0) {
    return truncated + '…'
  }

  return truncated.slice(0, lastSpace) + '…'
}

/**
 * Format an ISO dateTime string to a human-readable format (e.g., "Jun 26, 2025").
 */
export function formatEventDate(dateTime: string): string {
  const date = new Date(dateTime)
  if (isNaN(date.getTime())) {
    return 'Invalid date'
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Transform a RawMeetupEvent into a DisplayEvent.
 */
export function toDisplayEvent(event: RawMeetupEvent): DisplayEvent {
  return {
    id: event.id,
    title: event.title,
    descriptionPreview: truncateDescription(event.description),
    dateFormatted: formatEventDate(event.dateTime),
    dateTime: event.dateTime,
    eventUrl: event.eventUrl,
    rsvpCount: event.rsvps.totalCount,
  }
}

/**
 * Categorize events into upcoming and past based on a reference date.
 * Upcoming: dateTime strictly after referenceDate, sorted ascending (soonest first).
 * Past: dateTime at or before referenceDate, sorted descending (most recent first).
 * Invalid dateTime values are treated as past events.
 */
export function categorizeEvents(events: RawMeetupEvent[], referenceDate: Date): CategorizedEvents {
  const upcoming: DisplayEvent[] = []
  const past: DisplayEvent[] = []

  for (const event of events) {
    const eventDate = new Date(event.dateTime)
    const display = toDisplayEvent(event)

    if (!isNaN(eventDate.getTime()) && eventDate > referenceDate) {
      upcoming.push(display)
    } else {
      past.push(display)
    }
  }

  upcoming.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
  past.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())

  return { upcoming, past }
}
