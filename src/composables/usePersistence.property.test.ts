import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { usePersistence } from './usePersistence'
import type { Ticket } from '../types/ticket'
import type { RawMeetupGroup } from '../types/meetup'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a minimal valid Ticket object. */
const ticketArb: fc.Arbitrary<Ticket> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 30 }),
  id: fc.string({ minLength: 1, maxLength: 20 }),
  aliases: fc.array(
    fc.record({ precedence: fc.string(), id: fc.string() }),
    { maxLength: 3 },
  ),
  labels: fc.array(fc.string(), { maxLength: 3 }),
  customFields: fc.record({
    string: fc.array(fc.record({ id: fc.string(), value: fc.string() }), { maxLength: 2 }),
    date: fc.array(fc.record({ id: fc.string(), value: fc.string() }), { maxLength: 2 }),
    boolean: fc.array(fc.record({ id: fc.string(), value: fc.boolean() }), { maxLength: 2 }),
    number: fc.array(fc.record({ id: fc.string(), value: fc.double({ min: -1e6, max: 1e6, noNaN: true }) }), { maxLength: 2 }),
  }),
  extensions: fc.record({
    tt: fc.record({
      status: fc.string({ minLength: 1, maxLength: 20 }),
      computedPendingReason: fc.option(fc.string(), { nil: undefined }),
    }),
  }),
  assigneeIdentity: fc.option(fc.string(), { nil: undefined }),
  description: fc.string(),
  descriptionContentType: fc.constant('text/plain'),
})

/** Generate a minimal valid RawMeetupGroup object. */
const meetupArb: fc.Arbitrary<RawMeetupGroup> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  city: fc.string({ minLength: 1, maxLength: 20 }),
  country: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string(),
  foundedDate: fc.constant('2020-01-01'),
  proNetwork: fc.option(fc.string(), { nil: null }),
  memberships: fc.record({ totalCount: fc.nat({ max: 10000 }) }),
  socialNetworks: fc.constant([]),
  orgs: fc.constant({ edges: [] }),
  groupAnalytics: fc.constant(null),
  pastEvents: fc.constant({ edges: [] }),
  upcomingEvents: fc.constant({ edges: [] }),
})

/** Generate an array of tickets (0–5 elements). */
const ticketsArb: fc.Arbitrary<Ticket[]> = fc.array(ticketArb, { minLength: 0, maxLength: 5 })

/** Generate an array of meetups (0–5 elements). */
const meetupsArb: fc.Arbitrary<RawMeetupGroup[]> = fc.array(meetupArb, { minLength: 0, maxLength: 5 })

/** Generate an ISO 8601 timestamp string. */
const timestampArb: fc.Arbitrary<string> = fc
  .date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
  .map((d) => d.toISOString())

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Feature: data-persistence, Property 1: Save/load round-trip', () => {
  const { saveTickets, saveMeetups, loadTickets, loadMeetups, clearAll } = usePersistence()

  beforeEach(async () => {
    await clearAll()
  })

  // **Validates: Requirements 1.1, 1.2, 2.2**
  it('saving tickets then loading returns deeply equal data and same timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(ticketsArb, timestampArb, async (tickets, timestamp) => {
        await clearAll()
        await saveTickets(tickets, timestamp)
        const loaded = await loadTickets()

        expect(loaded).toBeDefined()
        expect(loaded!.data).toEqual(tickets)
        expect(loaded!.timestamp).toBe(timestamp)
      }),
      { numRuns: 100 },
    )
  })

  it('saving meetups then loading returns deeply equal data and same timestamp', async () => {
    await fc.assert(
      fc.asyncProperty(meetupsArb, timestampArb, async (meetups, timestamp) => {
        await clearAll()
        await saveMeetups(meetups, timestamp)
        const loaded = await loadMeetups()

        expect(loaded).toBeDefined()
        expect(loaded!.data).toEqual(meetups)
        expect(loaded!.timestamp).toBe(timestamp)
      }),
      { numRuns: 100 },
    )
  })
})

describe('Feature: data-persistence, Property 2: Overwrite returns latest and preserves other dataset', () => {
  const { saveTickets, saveMeetups, loadTickets, loadMeetups, clearAll } = usePersistence()

  beforeEach(async () => {
    await clearAll()
  })

  // **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  it('saving T1, then M, then T2 results in loadTickets returning T2 and loadMeetups returning M', async () => {
    await fc.assert(
      fc.asyncProperty(
        ticketsArb,
        ticketsArb,
        meetupsArb,
        timestampArb,
        timestampArb,
        timestampArb,
        async (t1, t2, m, ts1, ts2, ts3) => {
          await clearAll()
          await saveTickets(t1, ts1)
          await saveMeetups(m, ts2)
          await saveTickets(t2, ts3)

          const loadedTickets = await loadTickets()
          const loadedMeetups = await loadMeetups()

          expect(loadedTickets).toBeDefined()
          expect(loadedTickets!.data).toEqual(t2)
          expect(loadedTickets!.timestamp).toBe(ts3)

          expect(loadedMeetups).toBeDefined()
          expect(loadedMeetups!.data).toEqual(m)
          expect(loadedMeetups!.timestamp).toBe(ts2)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('saving M1, then T, then M2 results in loadMeetups returning M2 and loadTickets returning T', async () => {
    await fc.assert(
      fc.asyncProperty(
        meetupsArb,
        meetupsArb,
        ticketsArb,
        timestampArb,
        timestampArb,
        timestampArb,
        async (m1, m2, t, ts1, ts2, ts3) => {
          await clearAll()
          await saveMeetups(m1, ts1)
          await saveTickets(t, ts2)
          await saveMeetups(m2, ts3)

          const loadedMeetups = await loadMeetups()
          const loadedTickets = await loadTickets()

          expect(loadedMeetups).toBeDefined()
          expect(loadedMeetups!.data).toEqual(m2)
          expect(loadedMeetups!.timestamp).toBe(ts3)

          expect(loadedTickets).toBeDefined()
          expect(loadedTickets!.data).toEqual(t)
          expect(loadedTickets!.timestamp).toBe(ts2)
        },
      ),
      { numRuns: 100 },
    )
  })
})
