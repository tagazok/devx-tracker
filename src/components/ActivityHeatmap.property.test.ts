// Feature: heatmap-click-filter, Property 1: Click emission guards on ticket presence
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import type { HeatmapCell, HeatmapStatus } from '../utils/heatmapHelpers'

// ---------------------------------------------------------------------------
// Guard logic extracted from ActivityHeatmap.vue onCellClick
// ---------------------------------------------------------------------------

/**
 * Pure version of the onCellClick guard.
 * Returns the date string to emit, or null if the click should be ignored.
 */
function clickGuard(cell: HeatmapCell | null): string | null {
  if (!cell || cell.tickets.length === 0) return null
  return cell.date
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const heatmapStatusArb: fc.Arbitrary<HeatmapStatus> = fc.oneof(
  fc.constant('assigned' as HeatmapStatus),
  fc.constant('accepted' as HeatmapStatus),
  fc.constant('resolved' as HeatmapStatus),
)

const isoDateArb = fc
  .date({
    min: new Date('2020-01-01T00:00:00Z'),
    max: new Date('2030-12-31T00:00:00Z'),
  })
  .map((d) => {
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })

/** Generate a ticket entry for a HeatmapCell. */
const cellTicketArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }),
  status: heatmapStatusArb,
})

/** HeatmapCell with zero tickets (should NOT emit). */
const emptyCellArb: fc.Arbitrary<HeatmapCell> = isoDateArb.map((date) => ({
  date,
  tickets: [],
  dominantStatus: null,
}))

/** HeatmapCell with ≥1 ticket (should emit). */
const nonEmptyCellArb: fc.Arbitrary<HeatmapCell> = fc
  .tuple(
    isoDateArb,
    fc.array(cellTicketArb, { minLength: 1, maxLength: 10 }),
    fc.option(heatmapStatusArb, { nil: undefined }),
  )
  .map(([date, tickets, dominant]) => ({
    date,
    tickets,
    dominantStatus: dominant ?? tickets[0].status,
  }))

/** Any HeatmapCell (mixed). */
const anyCellArb: fc.Arbitrary<HeatmapCell> = fc.oneof(emptyCellArb, nonEmptyCellArb)

// ---------------------------------------------------------------------------
// Property 1: Click emission guards on ticket presence
// ---------------------------------------------------------------------------

describe('Property 1: Click emission guards on ticket presence', () => {
  // **Validates: Requirements 1.1, 1.3**

  it('emits the cell date if and only if the cell has ≥1 ticket; null cells and empty cells produce no emission', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // null cell
          fc.constant(null as HeatmapCell | null),
          // any HeatmapCell (empty or non-empty)
          anyCellArb,
        ),
        (cell) => {
          const result = clickGuard(cell)

          if (cell === null || cell.tickets.length === 0) {
            // Guard should block emission
            expect(result).toBeNull()
          } else {
            // Guard should allow emission with the cell's date
            expect(result).toBe(cell.date)
          }
        },
      ),
      { numRuns: 200 },
    )
  })

  it('never emits for null cells', () => {
    fc.assert(
      fc.property(fc.constant(null), (cell) => {
        expect(clickGuard(cell)).toBeNull()
      }),
      { numRuns: 100 },
    )
  })

  it('never emits for cells with zero tickets', () => {
    fc.assert(
      fc.property(emptyCellArb, (cell) => {
        expect(clickGuard(cell)).toBeNull()
      }),
      { numRuns: 100 },
    )
  })

  it('always emits the correct date for cells with ≥1 ticket', () => {
    fc.assert(
      fc.property(nonEmptyCellArb, (cell) => {
        const result = clickGuard(cell)
        expect(result).toBe(cell.date)
        // Verify the date is a valid ISO string format
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }),
      { numRuns: 100 },
    )
  })
})
