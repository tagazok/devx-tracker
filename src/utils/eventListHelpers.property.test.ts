// Feature: event-list-dialog, Property 1: Categorization and sorting correctness
// **Validates: Requirements 3.1, 3.7, 3.8**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { categorizeEvents, toDisplayEvent, truncateDescription } from './eventListHelpers'
import type { RawMeetupEvent } from '../types/meetup'

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

/** Generate a single RawMeetupEvent with valid ISO dateTime. */
const rawMeetupEventArb: fc.Arbitrary<RawMeetupEvent> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  description: fc.string({ maxLength: 50 }),
  dateTime: dateTimeArb,
  endTime: dateTimeArb,
  eventUrl: eventUrlArb,
  rsvps: fc.record({ totalCount: fc.nat({ max: 500 }) }),
})

/** Generate a reference date within the same range as events. */
const referenceDateArb: fc.Arbitrary<Date> = fc.date({
  min: new Date('2015-01-01'),
  max: new Date('2030-12-31'),
})

// ---------------------------------------------------------------------------
// Property 1: Categorization and sorting correctness
// ---------------------------------------------------------------------------

describe('Property 1: Categorization and sorting correctness', () => {
  // **Validates: Requirements 3.1, 3.7, 3.8**

  it('categorizes events into correct buckets, sorts them properly, and preserves total count', () => {
    fc.assert(
      fc.property(
        fc.array(rawMeetupEventArb, { minLength: 0, maxLength: 20 }),
        referenceDateArb,
        (events, referenceDate) => {
          const result = categorizeEvents(events, referenceDate)

          // (a) Every upcoming event has dateTime strictly after the reference date
          for (const event of result.upcoming) {
            const eventDate = new Date(event.dateTime)
            expect(eventDate.getTime()).toBeGreaterThan(referenceDate.getTime())
          }

          // (b) Every past event has dateTime at or before the reference date
          for (const event of result.past) {
            const eventDate = new Date(event.dateTime)
            expect(eventDate.getTime()).toBeLessThanOrEqual(referenceDate.getTime())
          }

          // (c) Upcoming events are sorted in ascending chronological order
          for (let i = 1; i < result.upcoming.length; i++) {
            const prev = new Date(result.upcoming[i - 1].dateTime).getTime()
            const curr = new Date(result.upcoming[i].dateTime).getTime()
            expect(prev).toBeLessThanOrEqual(curr)
          }

          // (d) Past events are sorted in descending chronological order
          for (let i = 1; i < result.past.length; i++) {
            const prev = new Date(result.past[i - 1].dateTime).getTime()
            const curr = new Date(result.past[i].dateTime).getTime()
            expect(prev).toBeGreaterThanOrEqual(curr)
          }

          // (e) Total count is preserved
          expect(result.upcoming.length + result.past.length).toBe(events.length)
        },
      ),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: event-list-dialog, Property 2: Event transformation preserves data
// ---------------------------------------------------------------------------

describe('Property 2: Event transformation preserves data', () => {
  // **Validates: Requirements 4.1, 4.3, 4.4**

  it('toDisplayEvent preserves id, title, rsvpCount and produces a non-empty dateFormatted', () => {
    fc.assert(
      fc.property(rawMeetupEventArb, (event) => {
        const display = toDisplayEvent(event)

        // (a) id matches input event's id
        expect(display.id).toBe(event.id)

        // (b) title matches input event's title
        expect(display.title).toBe(event.title)

        // (c) rsvpCount equals input event's rsvps.totalCount
        expect(display.rsvpCount).toBe(event.rsvps.totalCount)

        // (d) dateFormatted is a non-empty string
        expect(typeof display.dateFormatted).toBe('string')
        expect(display.dateFormatted.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: event-list-dialog, Property 3: Description truncation correctness
// ---------------------------------------------------------------------------

/** Generate a string that includes spaces to exercise word-boundary truncation. */
const descriptionWithSpacesArb: fc.Arbitrary<string> = fc
  .array(fc.stringMatching(/^[a-zA-Z]{1,15}$/), { minLength: 0, maxLength: 30 })
  .map((words) => words.join(' '))

/** Generate any string (may or may not contain spaces). */
const arbitraryStringArb: fc.Arbitrary<string> = fc.oneof(
  descriptionWithSpacesArb,
  fc.string({ minLength: 0, maxLength: 300 }),
)

/** Generate a reasonable maxLength value. */
const maxLengthArb: fc.Arbitrary<number> = fc.integer({ min: 10, max: 200 })

describe('Property 3: Description truncation correctness', () => {
  // **Validates: Requirements 4.2, 5.2, 5.3**

  it('short strings are returned unchanged, long strings are truncated at word boundary with ellipsis within length limit', () => {
    fc.assert(
      fc.property(arbitraryStringArb, maxLengthArb, (input, maxLength) => {
        const result = truncateDescription(input, maxLength)

        if (input.length <= maxLength) {
          // (a) Short strings returned unchanged
          expect(result).toBe(input)
        } else {
          // (b) Long strings end with "…"
          expect(result.endsWith('…')).toBe(true)

          // (c) Output length (excluding ellipsis) does not exceed maxLength
          const withoutEllipsis = result.slice(0, -1)
          expect(withoutEllipsis.length).toBeLessThanOrEqual(maxLength)

          // (d) If the input contained a space within the maxLength range,
          //     truncation should be at a word boundary (no trailing partial word)
          const sliceUpToMax = input.slice(0, maxLength)
          const hasSpaceInRange = sliceUpToMax.indexOf(' ') > 0
          if (hasSpaceInRange) {
            // The text before the ellipsis should end at a space boundary,
            // meaning it should not end with a partial word character that
            // is followed by more word characters in the original input.
            // Equivalently, the withoutEllipsis should be a prefix that ends
            // exactly where a space was in the original string.
            const nextCharInOriginal = input[withoutEllipsis.length]
            const endsCleanly =
              withoutEllipsis.endsWith(' ') ||
              nextCharInOriginal === ' ' ||
              nextCharInOriginal === undefined
            expect(endsCleanly).toBe(true)
          }
        }
      }),
      { numRuns: 100 },
    )
  })
})
