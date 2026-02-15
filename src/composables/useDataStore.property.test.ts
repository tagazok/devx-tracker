// Feature: data-upload-dialog, Property 2: Available tabs reflect data state
// **Validates: Requirements 5.1, 5.2, 5.3**
import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { useDataStore } from './useDataStore'
import type { Ticket } from '../types/ticket'
import type { RawMeetupGroup } from '../types/meetup'

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

/** Generate a minimal Ticket object. */
const ticketArb: fc.Arbitrary<Ticket> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 30 }),
  id: fc.string({ minLength: 1, maxLength: 20 }),
  aliases: fc.constant([]),
  labels: fc.constant([]),
  customFields: fc.constant({
    string: [],
    date: [],
    boolean: [],
    number: [],
  }),
  extensions: fc.constant({ tt: { status: 'Assigned' } }),
  description: fc.constant(''),
  descriptionContentType: fc.constant('text/plain'),
})

/** Generate a minimal RawMeetupGroup object. */
const meetupArb: fc.Arbitrary<RawMeetupGroup> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  city: fc.string({ minLength: 1, maxLength: 20 }),
  country: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.constant(''),
  foundedDate: fc.constant('2020-01-01'),
  proNetwork: fc.constant(null),
  socialNetworks: fc.constant([]),
  orgs: fc.constant({ edges: [] }),
  groupAnalytics: fc.constant(null),
  memberships: fc.constant({ totalCount: 0 }),
  pastEvents: fc.constant({ edges: [] }),
  upcomingEvents: fc.constant({ edges: [] }),
})

/** Generate either an empty array or a non-empty array of tickets. */
const ticketsArb: fc.Arbitrary<Ticket[]> = fc.oneof(
  fc.constant([] as Ticket[]),
  fc.array(ticketArb, { minLength: 1, maxLength: 5 }),
)

/** Generate either an empty array or a non-empty array of meetups. */
const meetupsArb: fc.Arbitrary<RawMeetupGroup[]> = fc.oneof(
  fc.constant([] as RawMeetupGroup[]),
  fc.array(meetupArb, { minLength: 1, maxLength: 5 }),
)

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TICKET_TABS = ['all', 'conferences', 'students'] as const
const MEETUP_TABS = ['community-goals'] as const

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Feature: data-upload-dialog, Property 2: Available tabs reflect data state', () => {
  const store = useDataStore()

  beforeEach(() => {
    store.reset()
  })

  it('availableTabs contains ticket tabs iff tickets is non-empty, and community-goals iff meetups is non-empty', () => {
    fc.assert(
      fc.property(ticketsArb, meetupsArb, (tickets, meetups) => {
        store.setData({ tickets, meetups })

        const tabs = store.availableTabs.value
        const hasTickets = tickets.length > 0
        const hasMeetups = meetups.length > 0

        // Ticket-related tabs present iff tickets non-empty
        for (const tab of TICKET_TABS) {
          expect(tabs.includes(tab)).toBe(hasTickets)
        }

        // Community-goals tab present iff meetups non-empty
        for (const tab of MEETUP_TABS) {
          expect(tabs.includes(tab)).toBe(hasMeetups)
        }

        // Statistics tab present iff any data exists
        const hasAnyData = hasTickets || hasMeetups
        expect(tabs.includes('statistics')).toBe(hasAnyData)

        // No extra tabs beyond what's expected (statistics + faq when data exists, plus ticket/meetup tabs)
        const expectedLength =
          (hasAnyData ? 2 : 0) + // statistics + faq
          (hasTickets ? TICKET_TABS.length : 0) +
          (hasMeetups ? MEETUP_TABS.length : 0)
        expect(tabs).toHaveLength(expectedLength)
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: data-upload-dialog, Property 3: setData fully replaces previous state
// **Validates: Requirements 6.3**
// ---------------------------------------------------------------------------

/** Generate a random UploadPayload. Each field is optionally present. */
const uploadPayloadArb = fc.record({
  tickets: fc.option(fc.array(ticketArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  meetups: fc.option(fc.array(meetupArb, { minLength: 0, maxLength: 5 }), { nil: undefined }),
})

describe('Feature: data-upload-dialog, Property 3: setData fully replaces previous state', () => {
  const store = useDataStore()

  beforeEach(() => {
    store.reset()
  })

  it('calling setData(P1) then setData(P2) results in store containing exactly P2 data', () => {
    fc.assert(
      fc.property(uploadPayloadArb, uploadPayloadArb, (p1, p2) => {
        // Apply first payload
        store.setData(p1)

        // Apply second payload — should fully replace tickets/meetups
        store.setData(p2)

        const expectedTickets = p2.tickets ?? []
        const expectedMeetups = p2.meetups ?? []

        expect(store.tickets.value).toEqual(expectedTickets)
        expect(store.meetups.value).toEqual(expectedMeetups)
      }),
      { numRuns: 100 },
    )
  })
})



// ---------------------------------------------------------------------------
// Feature: faq-page, Property 1: FAQ tab visibility reflects data state
// **Validates: Requirements 1.1, 1.3**
// ---------------------------------------------------------------------------

describe('Feature: faq-page, Property 1: FAQ tab visibility reflects data state', () => {
  const store = useDataStore()

  beforeEach(() => {
    store.reset()
  })

  it('availableTabs includes faq iff at least one of tickets or meetups is non-empty, and faq is always last', () => {
    fc.assert(
      fc.property(ticketsArb, meetupsArb, (tickets, meetups) => {
        store.setData({ tickets, meetups })

        const tabs = store.availableTabs.value
        const hasAnyData = tickets.length > 0 || meetups.length > 0

        // 'faq' is present iff at least one array is non-empty
        expect(tabs.includes('faq')).toBe(hasAnyData)

        // When present, 'faq' is always the last element
        if (hasAnyData) {
          expect(tabs[tabs.length - 1]).toBe('faq')
        }
      }),
      { numRuns: 100 },
    )
  })
})
