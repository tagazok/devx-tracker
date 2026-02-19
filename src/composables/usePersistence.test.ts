import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { usePersistence } from './usePersistence'

// ---------------------------------------------------------------------------
// Tests using real fake-indexeddb (no mocking needed)
// ---------------------------------------------------------------------------

describe('usePersistence', () => {
  const { saveTickets, saveMeetups, loadTickets, loadMeetups, clearAll } = usePersistence()

  beforeEach(async () => {
    await clearAll()
  })

  // Requirements 2.1, 2.4
  describe('loading when no data exists', () => {
    it('loadTickets returns undefined when no tickets have been saved', async () => {
      const result = await loadTickets()
      expect(result).toBeUndefined()
    })

    it('loadMeetups returns undefined when no meetups have been saved', async () => {
      const result = await loadMeetups()
      expect(result).toBeUndefined()
    })
  })

  // Requirement 1.4
  describe('clearAll', () => {
    it('removes both tickets and meetups data', async () => {
      const tickets = [
        {
          title: 'Test',
          id: 'T-1',
          aliases: [],
          labels: [],
          customFields: { string: [], date: [], boolean: [], number: [] },
          extensions: { tt: { status: 'Open' } },
          description: '',
          descriptionContentType: 'text/plain' as const,
        },
      ]
      const meetups = [
        {
          id: 'M-1',
          name: 'Test Group',
          city: 'Berlin',
          country: 'DE',
          description: '',
          foundedDate: '2020-01-01',
          proNetwork: null,
          memberships: { totalCount: 10 },
          socialNetworks: [],
          orgs: { edges: [] },
          groupAnalytics: null,
          pastEvents: { edges: [] },
          upcomingEvents: { edges: [] },
        },
      ]
      const ts = new Date().toISOString()

      await saveTickets(tickets as any, ts)
      await saveMeetups(meetups as any, ts)

      expect(await loadTickets()).toBeDefined()
      expect(await loadMeetups()).toBeDefined()

      await clearAll()

      expect(await loadTickets()).toBeUndefined()
      expect(await loadMeetups()).toBeUndefined()
    })
  })
})
