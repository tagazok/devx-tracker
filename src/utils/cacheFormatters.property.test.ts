// Feature: data-persistence, Property 3: Banner message mentions exactly the cached datasets
// Feature: data-persistence, Property 4: Timestamp formatting contains expected date components
// Feature: data-persistence, Property 5: ISO 8601 timestamp round-trip
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 5.2, 5.3**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { formatCacheTimestamp, buildCacheBannerMessage } from './cacheFormatters'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a valid Date within a reasonable range (year 2000–2099). */
const validDateArb: fc.Arbitrary<Date> = fc.date({
  min: new Date('2000-01-01T00:00:00.000Z'),
  max: new Date('2099-12-31T23:59:59.999Z'),
})

/** Generate an ISO 8601 timestamp string or null. */
const isoOrNullArb: fc.Arbitrary<string | null> = fc.oneof(
  fc.constant(null),
  validDateArb.map((d) => d.toISOString()),
)

const ABBREVIATED_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Feature: data-persistence, Property 3: Banner message mentions exactly the cached datasets', () => {
  it('output contains dataset labels iff corresponding timestamp is provided, and em dash iff both are provided', () => {
    fc.assert(
      fc.property(isoOrNullArb, isoOrNullArb, (ticketsTs, meetupsTs) => {
        const message = buildCacheBannerMessage(ticketsTs, meetupsTs)

        // "Tickets data from" present iff ticketsTs is provided
        expect(message.includes('Tickets data from')).toBe(ticketsTs !== null)

        // "Meetups data from" present iff meetupsTs is provided
        expect(message.includes('Meetups data from')).toBe(meetupsTs !== null)

        // Em dash separator present iff both timestamps are provided
        expect(message.includes('\u2014')).toBe(ticketsTs !== null && meetupsTs !== null)
      }),
      { numRuns: 100 },
    )
  })
})

describe('Feature: data-persistence, Property 4: Timestamp formatting contains expected date components', () => {
  it('formatted string contains abbreviated month, day, four-digit year, and time with hour and minute', () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const formatted = formatCacheTimestamp(date.toISOString())

        // Should contain an abbreviated month name
        const hasMonth = ABBREVIATED_MONTHS.some((m) => formatted.includes(m))
        expect(hasMonth).toBe(true)

        // Should contain the day number (from the locale-formatted date, not necessarily UTC day)
        const localDay = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(date)
        expect(formatted).toContain(localDay)

        // Should contain the four-digit year
        const localYear = new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(date)
        expect(formatted).toContain(localYear)

        // Should contain a time component with hour and minute (digit:digit pattern)
        expect(formatted).toMatch(/\d{1,2}:\d{2}/)
      }),
      { numRuns: 100 },
    )
  })
})

describe('Feature: data-persistence, Property 5: ISO 8601 timestamp round-trip', () => {
  it('converting a Date to ISO string and parsing back preserves getTime() value', () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const isoString = date.toISOString()
        const parsed = new Date(isoString)

        expect(parsed.getTime()).toBe(date.getTime())
      }),
      { numRuns: 100 },
    )
  })
})
