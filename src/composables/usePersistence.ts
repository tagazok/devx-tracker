import { get, set, del, createStore } from 'idb-keyval'
import type { Ticket } from '../types/ticket'
import type { RawMeetupGroup } from '../types/meetup'

export interface CachedDataset<T> {
  data: T
  timestamp: string // ISO 8601
}

export interface CacheTimestamps {
  tickets: string | null // ISO 8601 or null if not cached
  meetups: string | null
}

const store = createStore('devx-tracker-db', 'devx-tracker-store')

const TICKETS_KEY = 'tickets'
const MEETUPS_KEY = 'meetups'

export function usePersistence() {
  async function saveTickets(data: Ticket[], timestamp: string): Promise<void> {
    try {
      const cached: CachedDataset<Ticket[]> = { data, timestamp }
      await set(TICKETS_KEY, cached, store)
    } catch (error) {
      console.error('Failed to save tickets to IndexedDB:', error)
    }
  }

  async function saveMeetups(data: RawMeetupGroup[], timestamp: string): Promise<void> {
    try {
      const cached: CachedDataset<RawMeetupGroup[]> = { data, timestamp }
      await set(MEETUPS_KEY, cached, store)
    } catch (error) {
      console.error('Failed to save meetups to IndexedDB:', error)
    }
  }

  async function loadTickets(): Promise<CachedDataset<Ticket[]> | undefined> {
    try {
      return await get<CachedDataset<Ticket[]>>(TICKETS_KEY, store)
    } catch (error) {
      console.error('Failed to load tickets from IndexedDB:', error)
      return undefined
    }
  }

  async function loadMeetups(): Promise<CachedDataset<RawMeetupGroup[]> | undefined> {
    try {
      return await get<CachedDataset<RawMeetupGroup[]>>(MEETUPS_KEY, store)
    } catch (error) {
      console.error('Failed to load meetups from IndexedDB:', error)
      return undefined
    }
  }

  async function clearAll(): Promise<void> {
    try {
      await del(TICKETS_KEY, store)
      await del(MEETUPS_KEY, store)
    } catch (error) {
      console.error('Failed to clear IndexedDB cache:', error)
    }
  }

  return { saveTickets, saveMeetups, loadTickets, loadMeetups, clearAll }
}
