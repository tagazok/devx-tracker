import { describe, it, expect } from 'vitest'
import { formatCacheTimestamp, buildCacheBannerMessage } from './cacheFormatters'

describe('formatCacheTimestamp', () => {
  it('formats a known ISO date containing expected components', () => {
    const result = formatCacheTimestamp('2026-02-14T15:42:00.000Z')

    // Locale-dependent, so check for key components
    expect(result).toMatch(/Feb/)
    expect(result).toMatch(/14/)
    expect(result).toMatch(/2026/)
  })

  it('formats a different date with correct month and year', () => {
    const result = formatCacheTimestamp('2024-12-25T08:30:00.000Z')

    expect(result).toMatch(/Dec/)
    expect(result).toMatch(/25/)
    expect(result).toMatch(/2024/)
  })
})

describe('buildCacheBannerMessage', () => {
  it('returns empty string when both timestamps are null', () => {
    expect(buildCacheBannerMessage(null, null)).toBe('')
  })

  it('returns only tickets message when meetups is null', () => {
    const result = buildCacheBannerMessage('2026-02-14T15:42:00.000Z', null)

    expect(result).toContain('Tickets data from')
    expect(result).toMatch(/Feb/)
    expect(result).not.toContain('Meetups data from')
    expect(result).not.toContain('\u2014')
  })

  it('returns only meetups message when tickets is null', () => {
    const result = buildCacheBannerMessage(null, '2026-02-12T10:15:00.000Z')

    expect(result).toContain('Meetups data from')
    expect(result).toMatch(/Feb/)
    expect(result).not.toContain('Tickets data from')
    expect(result).not.toContain('\u2014')
  })

  it('returns both messages joined by em dash when both are provided', () => {
    const result = buildCacheBannerMessage(
      '2026-02-14T15:42:00.000Z',
      '2026-02-12T10:15:00.000Z',
    )

    expect(result).toContain('Tickets data from')
    expect(result).toContain('Meetups data from')
    expect(result).toContain('\u2014')

    // Tickets should come before meetups
    const ticketsIdx = result.indexOf('Tickets data from')
    const meetupsIdx = result.indexOf('Meetups data from')
    expect(ticketsIdx).toBeLessThan(meetupsIdx)
  })
})
