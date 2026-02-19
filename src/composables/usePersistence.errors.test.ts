import 'fake-indexeddb/auto'
import { describe, it, expect, vi, afterEach, afterAll } from 'vitest'

// Use vi.hoisted so mock fns are available when vi.mock is hoisted above imports
const { mockGet, mockSet, mockDel } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDel: vi.fn(),
}))

vi.mock('idb-keyval', () => ({
  get: mockGet,
  set: mockSet,
  del: mockDel,
  createStore: vi.fn(() => ({})),
}))

// Import AFTER vi.mock so the mock is in effect
import { usePersistence } from './usePersistence'

// Requirements 1.4, 2.4 — error handling
describe('usePersistence error handling', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it('saveTickets does not throw and logs error when IndexedDB write fails', async () => {
    mockSet.mockRejectedValueOnce(new Error('IndexedDB write failed'))

    const { saveTickets } = usePersistence()
    await expect(saveTickets([], new Date().toISOString())).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save tickets to IndexedDB:',
      expect.any(Error),
    )
  })

  it('saveMeetups does not throw and logs error when IndexedDB write fails', async () => {
    mockSet.mockRejectedValueOnce(new Error('IndexedDB write failed'))

    const { saveMeetups } = usePersistence()
    await expect(saveMeetups([], new Date().toISOString())).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save meetups to IndexedDB:',
      expect.any(Error),
    )
  })

  it('loadTickets returns undefined and logs error when IndexedDB read fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('IndexedDB read failed'))

    const { loadTickets } = usePersistence()
    const result = await loadTickets()

    expect(result).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load tickets from IndexedDB:',
      expect.any(Error),
    )
  })

  it('loadMeetups returns undefined and logs error when IndexedDB read fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('IndexedDB read failed'))

    const { loadMeetups } = usePersistence()
    const result = await loadMeetups()

    expect(result).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load meetups from IndexedDB:',
      expect.any(Error),
    )
  })

  it('clearAll does not throw and logs error when IndexedDB delete fails', async () => {
    mockDel.mockRejectedValueOnce(new Error('IndexedDB delete failed'))

    const { clearAll } = usePersistence()
    await expect(clearAll()).resolves.toBeUndefined()

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to clear IndexedDB cache:',
      expect.any(Error),
    )
  })
})
