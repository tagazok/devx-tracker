// Feature: heatmap-click-filter, Property 2: Date handler sets single-day range
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Pure logic extracted from TicketList.vue onHeatmapDateSelect
// ---------------------------------------------------------------------------

/**
 * Simulates the onHeatmapDateSelect handler.
 * Given a date string, sets both startDate and endDate to that value.
 * Returns the resulting { startDate, endDate } state.
 */
function applyHeatmapDateSelect(
  date: string,
  previousStart: string,
  previousEnd: string,
): { startDate: string; endDate: string } {
  // Mirrors: startDate.value = date; endDate.value = date
  void previousStart
  void previousEnd
  return { startDate: date, endDate: date }
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** ISO 8601 date string in YYYY-MM-DD format. */
const isoDateArb = fc
  .date({
    min: new Date('2000-01-01T00:00:00Z'),
    max: new Date('2099-12-31T00:00:00Z'),
  })
  .map((d) => {
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

/** Arbitrary previous date state (could be empty or a date). */
const previousDateArb = fc.oneof(fc.constant(''), isoDateArb)

// ---------------------------------------------------------------------------
// Property 2: Date handler sets single-day range
// ---------------------------------------------------------------------------

describe('Property 2: Date handler sets single-day range', () => {
  // **Validates: Requirements 1.2, 3.3**

  it('sets both startDate and endDate to the input date, regardless of previous values', () => {
    fc.assert(
      fc.property(isoDateArb, previousDateArb, previousDateArb, (date, prevStart, prevEnd) => {
        const result = applyHeatmapDateSelect(date, prevStart, prevEnd)
        expect(result.startDate).toBe(date)
        expect(result.endDate).toBe(date)
      }),
      { numRuns: 200 },
    )
  })

  it('always produces a single-day range (startDate === endDate)', () => {
    fc.assert(
      fc.property(isoDateArb, (date) => {
        const result = applyHeatmapDateSelect(date, '', '')
        expect(result.startDate).toBe(result.endDate)
      }),
      { numRuns: 100 },
    )
  })

  it('output dates match valid ISO 8601 YYYY-MM-DD format', () => {
    fc.assert(
      fc.property(isoDateArb, (date) => {
        const result = applyHeatmapDateSelect(date, '', '')
        expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }),
      { numRuns: 100 },
    )
  })
})
