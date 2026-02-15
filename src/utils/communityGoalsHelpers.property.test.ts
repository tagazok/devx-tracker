// Feature: community-goals, Property 1: Data transformation preserves all groups
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { computeCommunityGoalsData, deriveMeetupPageUrl } from './communityGoalsHelpers'
import type { RawMeetupEvent, RawMeetupGroup } from '../types/meetup'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a valid ISO dateTime string within a reasonable range. */
const dateTimeArb: fc.Arbitrary<string> = fc
  .date({ min: new Date('2015-01-01'), max: new Date('2030-12-31') })
  .map((d) => d.toISOString())

/** Generate a valid meetup-style event URL. */
const eventUrlArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/),
    fc.stringMatching(/^[a-z0-9]{5,12}$/),
  )
  .map(([slug, eventId]) => `https://www.meetup.com/${slug}/events/${eventId}/`)

/** Generate a single RawMeetupEvent. */
const rawMeetupEventArb: fc.Arbitrary<RawMeetupEvent> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ maxLength: 50 }),
  dateTime: dateTimeArb,
  endTime: dateTimeArb,
  eventUrl: eventUrlArb,
  rsvps: fc.record({ totalCount: fc.nat({ max: 500 }) }),
})

/** Wrap events into the edges structure used by the raw JSON. */
function toEdges(events: RawMeetupEvent[]): { edges: { node: RawMeetupEvent }[] } {
  return { edges: events.map((node) => ({ node })) }
}

/** Generate a single RawMeetupGroup with random past and upcoming events. */
const rawMeetupGroupArb: fc.Arbitrary<RawMeetupGroup> = fc
  .tuple(
    fc.uuid(),
    fc.string({ minLength: 1, maxLength: 40 }),
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.nat({ max: 5000 }),
    fc.array(rawMeetupEventArb, { minLength: 0, maxLength: 10 }),
    fc.array(rawMeetupEventArb, { minLength: 0, maxLength: 10 }),
  )
  .map(([id, name, city, country, memberCount, pastEvents, upcomingEvents]) => ({
    id,
    name,
    city,
    country,
    description: '',
    foundedDate: '2020-01-01',
    proNetwork: null,
    socialNetworks: [],
    orgs: { edges: [] },
    groupAnalytics: null,
    memberships: { totalCount: memberCount },
    pastEvents: toEdges(pastEvents),
    upcomingEvents: toEdges(upcomingEvents),
  }))

/** Arbitrary year within the range of generated events. */
const yearArb: fc.Arbitrary<number> = fc.integer({ min: 2015, max: 2030 })

// ---------------------------------------------------------------------------
// Property 1: Data transformation preserves all groups
// ---------------------------------------------------------------------------

describe('Property 1: Data transformation preserves all groups', () => {
  // **Validates: Requirements 2.1**

  it('output array has the same length as input and preserves id and name for each group', () => {
    fc.assert(
      fc.property(
        fc.array(rawMeetupGroupArb, { minLength: 0, maxLength: 20 }),
        yearArb,
        (groups, year) => {
          const result = computeCommunityGoalsData(groups, year)

          // Same length
          expect(result.length).toBe(groups.length)

          // Each output entry preserves id and name from the corresponding input
          for (let i = 0; i < groups.length; i++) {
            expect(result[i].id).toBe(groups[i].id)
            expect(result[i].name).toBe(groups[i].name)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: community-goals, Property 2: URL derivation extracts base path
// ---------------------------------------------------------------------------

describe('Property 2: URL derivation extracts base path', () => {
  // **Validates: Requirements 2.2**

  it('extracts the base meetup group URL from a valid meetup event URL', () => {
    const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{2,20}$/)
    const eventIdArb = fc.stringMatching(/^[a-z0-9]{5,12}$/)

    fc.assert(
      fc.property(slugArb, eventIdArb, (slug, eventId) => {
        const eventUrl = `https://www.meetup.com/${slug}/events/${eventId}/`
        const result = deriveMeetupPageUrl(eventUrl)

        expect(result).toBe(`https://www.meetup.com/${slug}/`)
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: community-goals, Property 3: Year and month extraction correctness
// ---------------------------------------------------------------------------

import { extractYear, extractMonth } from './communityGoalsHelpers'

describe('Property 3: Year and month extraction correctness', () => {
  // **Validates: Requirements 2.4**

  it('extractYear and extractMonth return correct values for any valid ISO dateTime', () => {
    // Generate date components directly to avoid timezone ambiguity.
    // We construct an ISO string and then compare using the same Date parsing
    // the implementation uses (new Date(str).getFullYear() / getMonth()).
    const dateComponentsArb = fc.record({
      year: fc.integer({ min: 2000, max: 2099 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }), // 28 to avoid invalid dates
      hour: fc.integer({ min: 0, max: 23 }),
      minute: fc.integer({ min: 0, max: 59 }),
      second: fc.integer({ min: 0, max: 59 }),
    })

    fc.assert(
      fc.property(dateComponentsArb, ({ year, month, day, hour, minute, second }) => {
        const isoStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`

        // Parse with the same approach the implementation uses
        const parsed = new Date(isoStr)
        const expectedYear = parsed.getFullYear()
        const expectedMonth = parsed.getMonth()

        expect(extractYear(isoStr)).toBe(expectedYear)
        expect(extractMonth(isoStr)).toBe(expectedMonth)
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: community-goals, Property 4: Monthly counts array invariant
// ---------------------------------------------------------------------------

describe('Property 4: Monthly counts array invariant', () => {
  // **Validates: Requirements 4.1**

  it('monthlyCounts has exactly 12 elements and all values are >= 0 for every group', () => {
    fc.assert(
      fc.property(
        fc.array(rawMeetupGroupArb, { minLength: 0, maxLength: 20 }),
        yearArb,
        (groups, year) => {
          const result = computeCommunityGoalsData(groups, year)

          for (const group of result) {
            expect(group.monthlyCounts).toHaveLength(12)
            for (const count of group.monthlyCounts) {
              expect(count).toBeGreaterThanOrEqual(0)
              expect(Number.isInteger(count)).toBe(true)
            }
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: community-goals, Property 5: Monthly counts sum equals event count
// ---------------------------------------------------------------------------

describe('Property 5: Monthly counts sum equals event count', () => {
  // **Validates: Requirements 3.4, 5.2**

  it('sum of monthlyCounts equals eventCount for every group', () => {
    fc.assert(
      fc.property(
        fc.array(rawMeetupGroupArb, { minLength: 1, maxLength: 20 }),
        yearArb,
        (groups, year) => {
          const result = computeCommunityGoalsData(groups, year)

          for (const group of result) {
            const monthlySum = group.monthlyCounts.reduce((sum, c) => sum + c, 0)
            expect(monthlySum).toBe(group.eventCount)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: community-goals, Property 6: Goal met iff event count reaches threshold
// ---------------------------------------------------------------------------

describe('Property 6: Goal met iff event count reaches threshold', () => {
  // **Validates: Requirements 3.5, 5.4**

  it('goalMet === (eventCount >= 7) for every group in the output', () => {
    fc.assert(
      fc.property(
        fc.array(rawMeetupGroupArb, { minLength: 1, maxLength: 20 }),
        yearArb,
        (groups, year) => {
          const result = computeCommunityGoalsData(groups, year)

          for (const group of result) {
            expect(group.goalMet).toBe(group.eventCount >= 7)
          }
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: community-goals, Property 7: Year filtering correctness
// ---------------------------------------------------------------------------

describe('Property 7: Year filtering correctness', () => {
  // **Validates: Requirements 6.1, 6.2**

  /**
   * Strategy: Generate a target year and a distinct "other" year. For each
   * group, generate two sets of events — one set with dateTimes in the target
   * year and another set with dateTimes in the other year. After calling
   * computeCommunityGoalsData with the target year, verify that eventCount
   * equals exactly the number of events generated for the target year.
   */

  /** Generate an ISO dateTime string pinned to a specific year. */
  const dateTimeInYearArb = (year: number): fc.Arbitrary<string> =>
    fc
      .record({
        month: fc.integer({ min: 1, max: 12 }),
        day: fc.integer({ min: 1, max: 28 }),
        hour: fc.integer({ min: 0, max: 23 }),
        minute: fc.integer({ min: 0, max: 59 }),
        second: fc.integer({ min: 0, max: 59 }),
      })
      .map(
        ({ month, day, hour, minute, second }) =>
          `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}.000Z`,
      )

  /** Generate a RawMeetupEvent with its dateTime pinned to a specific year. */
  const eventInYearArb = (year: number): fc.Arbitrary<RawMeetupEvent> =>
    fc.record({
      id: fc.uuid(),
      title: fc.string({ minLength: 1, maxLength: 20 }),
      description: fc.string({ maxLength: 30 }),
      dateTime: dateTimeInYearArb(year),
      endTime: dateTimeInYearArb(year),
      eventUrl: eventUrlArb,
      rsvps: fc.record({ totalCount: fc.nat({ max: 200 }) }),
    })

  it('eventCount only reflects events whose dateTime falls within the specified year', () => {
    fc.assert(
      fc.property(
        fc
          .integer({ min: 2016, max: 2029 })
          .chain((targetYear) =>
            fc
              .integer({ min: 2015, max: 2030 })
              .filter((y) => y !== targetYear)
              .chain((otherYear) =>
                fc
                  .tuple(
                    fc.array(eventInYearArb(targetYear), { minLength: 0, maxLength: 8 }),
                    fc.array(eventInYearArb(otherYear), { minLength: 0, maxLength: 8 }),
                  )
                  .map(([targetEvents, otherEvents]) => ({
                    targetYear,
                    otherYear,
                    targetEvents,
                    otherEvents,
                  })),
              ),
          ),
        ({ targetYear, targetEvents, otherEvents }) => {
          // Build a group whose pastEvents contain target-year events
          // and upcomingEvents contain other-year events
          const group: RawMeetupGroup = {
            id: 'test-group',
            name: 'Test Group',
            city: 'TestCity',
            country: 'TC',
            description: '',
            foundedDate: '2020-01-01',
            proNetwork: null,
            socialNetworks: [],
            orgs: { edges: [] },
            groupAnalytics: null,
            memberships: { totalCount: 100 },
            pastEvents: toEdges(targetEvents),
            upcomingEvents: toEdges(otherEvents),
          }

          const result = computeCommunityGoalsData([group], targetYear)

          expect(result).toHaveLength(1)
          // eventCount should equal only the target-year events
          expect(result[0].eventCount).toBe(targetEvents.length)
        },
      ),
      { numRuns: 100 },
    )
  })
})
