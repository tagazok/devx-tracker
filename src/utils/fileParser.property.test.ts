// Feature: data-upload-dialog, Property 4: JSON parse round-trip
// **Validates: Requirements 4.2**
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readJsonFile } from './fileParser'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a random JSON-serializable value (objects, arrays, strings, numbers, booleans, null). */
const jsonSerializableArb: fc.Arbitrary<unknown> = fc.jsonValue()

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Feature: data-upload-dialog, Property 4: JSON parse round-trip', () => {
  it('readJsonFile produces an object deeply equal to the original for any JSON-serializable value', async () => {
    await fc.assert(
      fc.asyncProperty(jsonSerializableArb, async (original) => {
        const jsonString = JSON.stringify(original)
        const file = new File([jsonString], 'test.json', { type: 'application/json' })

        const result = await readJsonFile(file)

        expect(result).toEqual(original)
      }),
      { numRuns: 100 },
    )
  })
})
