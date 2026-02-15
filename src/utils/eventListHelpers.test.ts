import { describe, it, expect } from 'vitest'
import {
  truncateDescription,
  formatEventDate,
  toDisplayEvent,
  categorizeEvents,
} from './eventListHelpers'
import type { RawMeetupEvent } from '../types/meetup'

/**
 * Helper to create a minimal RawMeetupEvent for testing.
 */
function makeEvent(overrides: Partial<RawMeetupEvent> & { rsvpCount?: number } = {}): RawMeetupEvent {
  const { rsvpCount, ...rest } = overrides
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: 'A short description',
    dateTime: '2025-06-15T18:00:00',
    endTime: '2025-06-15T20:00:00',
    eventUrl: 'https://meetup.com/event/1',
    rsvps: { totalCount: rsvpCount ?? 10 },
    ...rest,
  }
}

// ---------------------------------------------------------------------------
// truncateDescription
// ---------------------------------------------------------------------------
describe('truncateDescription', () => {
  it('returns empty string as-is', () => {
    expect(truncateDescription('')).toBe('')
  })

  it('returns a short string unchanged', () => {
    expect(truncateDescription('Hello world')).toBe('Hello world')
  })

  it('returns a string exactly at the limit unchanged', () => {
    const exact = 'a'.repeat(150)
    expect(truncateDescription(exact)).toBe(exact)
  })

  it('truncates a long string at a word boundary and appends ellipsis', () => {
    const long = 'word '.repeat(40) // 200 chars
    const result = truncateDescription(long, 150)
    expect(result.endsWith('…')).toBe(true)
    // The part before the ellipsis should not exceed maxLength
    expect(result.length - 1).toBeLessThanOrEqual(150)
    // Should not end with a partial word (no trailing space before ellipsis)
    const withoutEllipsis = result.slice(0, -1)
    expect(withoutEllipsis).not.toMatch(/\s$/)
  })

  it('truncates a single long word without spaces by slicing at maxLength', () => {
    const longWord = 'a'.repeat(200)
    const result = truncateDescription(longWord, 150)
    expect(result).toBe('a'.repeat(150) + '…')
  })

  it('returns whitespace-only string unchanged when within limit', () => {
    const spaces = '   '
    expect(truncateDescription(spaces)).toBe(spaces)
  })

  it('respects a custom maxLength', () => {
    const result = truncateDescription('hello world foo bar', 10)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length - 1).toBeLessThanOrEqual(10)
  })
})

// ---------------------------------------------------------------------------
// formatEventDate
// ---------------------------------------------------------------------------
describe('formatEventDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatEventDate('2025-06-26T18:00:00')
    expect(result).toBe('Jun 26, 2025')
  })

  it('formats January 1st correctly', () => {
    const result = formatEventDate('2025-01-01T00:00:00')
    expect(result).toBe('Jan 1, 2025')
  })

  it('formats December 31st correctly', () => {
    const result = formatEventDate('2025-12-31T23:59:59')
    expect(result).toBe('Dec 31, 2025')
  })

  it('returns "Invalid date" for an invalid dateTime', () => {
    expect(formatEventDate('not-a-date')).toBe('Invalid date')
  })
})

// ---------------------------------------------------------------------------
// toDisplayEvent
// ---------------------------------------------------------------------------
describe('toDisplayEvent', () => {
  it('transforms a typical event correctly', () => {
    const event = makeEvent({
      id: 'e-42',
      title: 'Vue Meetup',
      description: 'Come learn Vue!',
      dateTime: '2025-06-26T18:00:00',
      rsvpCount: 25,
    })
    const display = toDisplayEvent(event)

    expect(display.id).toBe('e-42')
    expect(display.title).toBe('Vue Meetup')
    expect(display.descriptionPreview).toBe('Come learn Vue!')
    expect(display.dateFormatted).toBe('Jun 26, 2025')
    expect(display.dateTime).toBe('2025-06-26T18:00:00')
    expect(display.rsvpCount).toBe(25)
  })

  it('handles an empty description', () => {
    const event = makeEvent({ description: '' })
    const display = toDisplayEvent(event)
    expect(display.descriptionPreview).toBe('')
  })

  it('truncates a long description', () => {
    const longDesc = 'word '.repeat(40) // 200 chars
    const event = makeEvent({ description: longDesc })
    const display = toDisplayEvent(event)
    expect(display.descriptionPreview.endsWith('…')).toBe(true)
    expect(display.descriptionPreview.length).toBeLessThanOrEqual(151) // 150 + ellipsis char
  })
})

// ---------------------------------------------------------------------------
// categorizeEvents
// ---------------------------------------------------------------------------
describe('categorizeEvents', () => {
  const referenceDate = new Date('2025-06-15T12:00:00')

  it('returns empty arrays for an empty input', () => {
    const result = categorizeEvents([], referenceDate)
    expect(result.upcoming).toEqual([])
    expect(result.past).toEqual([])
  })

  it('puts all future events into upcoming', () => {
    const events = [
      makeEvent({ id: 'a', dateTime: '2025-07-01T10:00:00' }),
      makeEvent({ id: 'b', dateTime: '2025-08-01T10:00:00' }),
    ]
    const result = categorizeEvents(events, referenceDate)
    expect(result.upcoming).toHaveLength(2)
    expect(result.past).toHaveLength(0)
  })

  it('puts all past events into past', () => {
    const events = [
      makeEvent({ id: 'a', dateTime: '2025-01-01T10:00:00' }),
      makeEvent({ id: 'b', dateTime: '2025-03-01T10:00:00' }),
    ]
    const result = categorizeEvents(events, referenceDate)
    expect(result.upcoming).toHaveLength(0)
    expect(result.past).toHaveLength(2)
  })

  it('splits mixed events into upcoming and past', () => {
    const events = [
      makeEvent({ id: 'past-1', dateTime: '2025-01-10T10:00:00' }),
      makeEvent({ id: 'future-1', dateTime: '2025-09-10T10:00:00' }),
      makeEvent({ id: 'past-2', dateTime: '2025-05-20T10:00:00' }),
      makeEvent({ id: 'future-2', dateTime: '2025-07-05T10:00:00' }),
    ]
    const result = categorizeEvents(events, referenceDate)

    expect(result.upcoming).toHaveLength(2)
    expect(result.past).toHaveLength(2)
  })

  it('sorts upcoming events in ascending order (soonest first)', () => {
    const events = [
      makeEvent({ id: 'later', dateTime: '2025-09-01T10:00:00' }),
      makeEvent({ id: 'sooner', dateTime: '2025-07-01T10:00:00' }),
    ]
    const result = categorizeEvents(events, referenceDate)

    expect(result.upcoming[0].id).toBe('sooner')
    expect(result.upcoming[1].id).toBe('later')
  })

  it('sorts past events in descending order (most recent first)', () => {
    const events = [
      makeEvent({ id: 'older', dateTime: '2025-01-01T10:00:00' }),
      makeEvent({ id: 'newer', dateTime: '2025-05-01T10:00:00' }),
    ]
    const result = categorizeEvents(events, referenceDate)

    expect(result.past[0].id).toBe('newer')
    expect(result.past[1].id).toBe('older')
  })

  it('treats an event exactly at the reference date as past', () => {
    const events = [makeEvent({ id: 'exact', dateTime: '2025-06-15T12:00:00' })]
    const result = categorizeEvents(events, referenceDate)

    expect(result.upcoming).toHaveLength(0)
    expect(result.past).toHaveLength(1)
    expect(result.past[0].id).toBe('exact')
  })
})
