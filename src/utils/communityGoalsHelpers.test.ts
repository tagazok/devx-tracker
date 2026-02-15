import { describe, it, expect } from 'vitest'
import {
  deriveMeetupPageUrl,
  extractYear,
  extractMonth,
  getAllEvents,
  computeMonthlyEventCounts,
  computeCommunityGoalsData,
} from './communityGoalsHelpers'
import type { RawMeetupEvent, RawMeetupGroup } from '../types/meetup'

/**
 * Helper to create a minimal RawMeetupEvent for testing.
 */
function makeEvent(overrides: Partial<RawMeetupEvent> = {}): RawMeetupEvent {
  return {
    id: overrides.id ?? 'evt-1',
    title: overrides.title ?? 'Test Event',
    description: overrides.description ?? '',
    dateTime: overrides.dateTime ?? '2024-03-15T18:00:00Z',
    endTime: overrides.endTime ?? '2024-03-15T20:00:00Z',
    eventUrl: overrides.eventUrl ?? 'https://www.meetup.com/test-group/events/123/',
    rsvps: overrides.rsvps ?? { totalCount: 10 },
  }
}

/**
 * Helper to create a minimal RawMeetupGroup for testing.
 */
function makeGroup(overrides: {
  id?: string
  name?: string
  city?: string
  country?: string
  pastEvents?: RawMeetupEvent[]
  upcomingEvents?: RawMeetupEvent[]
} = {}): RawMeetupGroup {
  return {
    id: overrides.id ?? 'group-1',
    name: overrides.name ?? 'Test Group',
    city: overrides.city ?? 'Berlin',
    country: overrides.country ?? 'Germany',
    description: '',
    foundedDate: '2020-01-01',
    proNetwork: null,
    memberships: { totalCount: 100 },
    socialNetworks: [],
    orgs: { edges: [] },
    groupAnalytics: null,
    pastEvents: {
      edges: (overrides.pastEvents ?? []).map((node) => ({ node })),
    },
    upcomingEvents: {
      edges: (overrides.upcomingEvents ?? []).map((node) => ({ node })),
    },
  }
}

/**
 * Validates: Requirements 2.2
 */
describe('deriveMeetupPageUrl', () => {
  it('extracts base group URL from a valid event URL', () => {
    const url = 'https://www.meetup.com/french-aws-ug/events/12345/'
    expect(deriveMeetupPageUrl(url)).toBe('https://www.meetup.com/french-aws-ug/')
  })

  it('extracts base group URL without trailing event path', () => {
    const url = 'https://www.meetup.com/my-group/events/99999'
    expect(deriveMeetupPageUrl(url)).toBe('https://www.meetup.com/my-group/')
  })

  it('returns null for a malformed URL missing the meetup.com domain', () => {
    expect(deriveMeetupPageUrl('https://example.com/some-group/events/1/')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(deriveMeetupPageUrl('')).toBeNull()
  })

  it('returns null for a URL with no group slug', () => {
    expect(deriveMeetupPageUrl('https://www.meetup.com/')).toBeNull()
  })
})

/**
 * Validates: Requirements 2.4
 */
describe('extractYear', () => {
  it('returns the year from a valid ISO dateTime string', () => {
    expect(extractYear('2024-06-15T10:00:00Z')).toBe(2024)
  })

  it('returns the year from a date-only string', () => {
    expect(extractYear('2023-01-01')).toBe(2023)
  })

  it('returns null for an invalid date string', () => {
    expect(extractYear('not-a-date')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractYear('')).toBeNull()
  })
})

/**
 * Validates: Requirements 2.4
 */
describe('extractMonth', () => {
  it('returns 0 for January', () => {
    expect(extractMonth('2024-01-15T10:00:00Z')).toBe(0)
  })

  it('returns 11 for December', () => {
    expect(extractMonth('2024-12-25T10:00:00Z')).toBe(11)
  })

  it('returns null for an invalid date string', () => {
    expect(extractMonth('garbage')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractMonth('')).toBeNull()
  })
})

/**
 * Validates: Requirements 2.1
 */
describe('getAllEvents', () => {
  it('combines past and upcoming events', () => {
    const past = makeEvent({ id: 'p1' })
    const upcoming = makeEvent({ id: 'u1' })
    const group = makeGroup({ pastEvents: [past], upcomingEvents: [upcoming] })

    const result = getAllEvents(group)
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.id)).toEqual(['p1', 'u1'])
  })

  it('returns empty array when group has no events', () => {
    const group = makeGroup()
    expect(getAllEvents(group)).toEqual([])
  })
})

/**
 * Validates: Requirements 5.2
 */
describe('computeMonthlyEventCounts', () => {
  it('returns 12-element array of zeros for no events', () => {
    const { counts } = computeMonthlyEventCounts([], 2024)
    expect(counts).toHaveLength(12)
    expect(counts.every((c) => c === 0)).toBe(true)
  })

  it('counts events in the correct month for the given year', () => {
    const events = [
      makeEvent({ dateTime: '2024-01-10T10:00:00Z' }),
      makeEvent({ dateTime: '2024-01-20T10:00:00Z' }),
      makeEvent({ dateTime: '2024-06-05T10:00:00Z' }),
    ]
    const { counts } = computeMonthlyEventCounts(events, 2024)
    expect(counts[0]).toBe(2) // January
    expect(counts[5]).toBe(1) // June
    expect(counts[11]).toBe(0) // December
  })

  it('excludes events from a different year', () => {
    const events = [
      makeEvent({ dateTime: '2023-03-10T10:00:00Z' }),
      makeEvent({ dateTime: '2024-03-10T10:00:00Z' }),
    ]
    const { counts } = computeMonthlyEventCounts(events, 2024)
    expect(counts[2]).toBe(1) // Only the 2024 event
  })

  it('collects event titles per month', () => {
    const events = [
      makeEvent({ title: 'Jan Meetup', dateTime: '2024-01-10T10:00:00Z' }),
      makeEvent({ title: 'Jun Meetup', dateTime: '2024-06-05T10:00:00Z' }),
    ]
    const { titles } = computeMonthlyEventCounts(events, 2024)
    expect(titles[0]).toEqual(['Jan Meetup'])
    expect(titles[5]).toEqual(['Jun Meetup'])
    expect(titles[11]).toEqual([])
  })
})

/**
 * Validates: Requirements 2.1, 2.2, 2.3, 5.3
 */
describe('computeCommunityGoalsData', () => {
  it('returns empty array for empty input', () => {
    expect(computeCommunityGoalsData([], 2024)).toEqual([])
  })

  it('returns group with zero counts when group has no events', () => {
    const group = makeGroup({ id: 'g1', name: 'Empty Group' })
    const result = computeCommunityGoalsData([group], 2024)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('g1')
    expect(result[0].name).toBe('Empty Group')
    expect(result[0].eventCount).toBe(0)
    expect(result[0].goalMet).toBe(false)
    expect(result[0].meetupPageUrl).toBeNull()
    expect(result[0].monthlyCounts).toEqual(new Array(12).fill(0))
  })

  it('computes correct data for a group with events in multiple years', () => {
    const events2023 = [
      makeEvent({ id: 'e1', dateTime: '2023-05-10T10:00:00Z' }),
    ]
    const events2024 = [
      makeEvent({ id: 'e2', dateTime: '2024-02-10T10:00:00Z' }),
      makeEvent({ id: 'e3', dateTime: '2024-07-15T10:00:00Z' }),
    ]
    const group = makeGroup({
      pastEvents: [...events2023, ...events2024],
    })

    const result = computeCommunityGoalsData([group], 2024)

    expect(result[0].eventCount).toBe(2)
    expect(result[0].monthlyCounts[1]).toBe(1) // February
    expect(result[0].monthlyCounts[6]).toBe(1) // July
    expect(result[0].goalMet).toBe(false)
  })

  it('sets goalMet to true when event count reaches 7', () => {
    const events = Array.from({ length: 7 }, (_, i) =>
      makeEvent({ id: `e${i}`, dateTime: `2024-${String(i + 1).padStart(2, '0')}-10T10:00:00Z` }),
    )
    const group = makeGroup({ pastEvents: events })

    const result = computeCommunityGoalsData([group], 2024)
    expect(result[0].eventCount).toBe(7)
    expect(result[0].goalMet).toBe(true)
  })

  it('derives meetupPageUrl from the first event with a URL', () => {
    const event = makeEvent({ eventUrl: 'https://www.meetup.com/aws-berlin/events/555/' })
    const group = makeGroup({ pastEvents: [event] })

    const result = computeCommunityGoalsData([group], 2024)
    expect(result[0].meetupPageUrl).toBe('https://www.meetup.com/aws-berlin/')
  })

  it('sets meetupPageUrl to null when no events have a URL', () => {
    const event = makeEvent({ eventUrl: '' })
    const group = makeGroup({ pastEvents: [event] })

    const result = computeCommunityGoalsData([group], 2024)
    expect(result[0].meetupPageUrl).toBeNull()
  })

  it('preserves city and country from the input group', () => {
    const group = makeGroup({ city: 'Paris', country: 'France' })
    const result = computeCommunityGoalsData([group], 2024)
    expect(result[0].city).toBe('Paris')
    expect(result[0].country).toBe('France')
  })
})
