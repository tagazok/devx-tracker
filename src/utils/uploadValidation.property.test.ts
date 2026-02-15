// Feature: data-upload-dialog, Property 1: File selection validation
// **Validates: Requirements 2.5, 3.1, 3.2, 3.3, 3.4**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateFileSelections } from './uploadValidation'
import type { FileSelections } from './uploadValidation'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a mock File or null. */
const fileOrNullArb: fc.Arbitrary<File | null> = fc.oneof(
  fc.constant(null),
  fc.string({ minLength: 1, maxLength: 20 }).map(
    (name) => new File(['{}'], `${name}.json`, { type: 'application/json' }),
  ),
)

/** Generate a random FileSelections object. */
const fileSelectionsArb: fc.Arbitrary<FileSelections> = fc.record({
  ticketsFile: fileOrNullArb,
  meetupsFile: fileOrNullArb,
})

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Feature: data-upload-dialog, Property 1: File selection validation', () => {
  it('returns valid=true iff at least one file is selected', () => {
    fc.assert(
      fc.property(fileSelectionsArb, (selections) => {
        const result = validateFileSelections(selections)

        const hasAnyFile = !!(
          selections.ticketsFile ||
          selections.meetupsFile
        )

        expect(result.valid).toBe(hasAnyFile)

        // When valid, there should be no error
        if (result.valid) {
          expect(result.error).toBeNull()
        }
      }),
      { numRuns: 100 },
    )
  })
})
