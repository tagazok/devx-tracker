import type { RawMeetupEvent, RawMeetupGroup, MeetupGroupDisplay } from '../types/meetup'

/**
 * Derive the meetup group page URL from an event URL.
 * For a URL like `https://www.meetup.com/french-aws-ug/events/12345/`,
 * returns `https://www.meetup.com/french-aws-ug/`.
 * Returns null for malformed URLs.
 */
export function deriveMeetupPageUrl(eventUrl: string): string | null {
  const match = eventUrl.match(/^(https:\/\/www\.meetup\.com\/[^/]+\/)/)
  return match ? match[1] : null
}

/**
 * Extract year from an ISO dateTime string.
 * Returns null for invalid strings.
 */
export function extractYear(dateTime: string): number | null {
  const date = new Date(dateTime)
  if (isNaN(date.getTime())) return null
  return date.getFullYear()
}

/**
 * Extract month (0-11) from an ISO dateTime string.
 * Returns null for invalid strings.
 */
export function extractMonth(dateTime: string): number | null {
  const date = new Date(dateTime)
  if (isNaN(date.getTime())) return null
  return date.getMonth()
}

/**
 * Collect all events (past + upcoming) from a raw meetup group.
 */
export function getAllEvents(group: RawMeetupGroup): RawMeetupEvent[] {
  const past = group.pastEvents.edges.map((edge) => edge.node)
  const upcoming = group.upcomingEvents.edges.map((edge) => edge.node)
  return [...past, ...upcoming]
}

/**
 * Compute monthly event counts and titles for a given year.
 * Returns a 12-element array where index 0 = January, 11 = December.
 * Events with invalid dateTime are excluded.
 */
export function computeMonthlyEventCounts(events: RawMeetupEvent[], year: number): { counts: number[]; titles: string[][] } {
  const counts = new Array<number>(12).fill(0)
  const titles: string[][] = Array.from({ length: 12 }, () => [])
  for (const event of events) {
    const eventYear = extractYear(event.dateTime)
    const eventMonth = extractMonth(event.dateTime)
    if (eventYear === year && eventMonth !== null) {
      counts[eventMonth]++
      titles[eventMonth].push(event.title)
    }
  }
  return { counts, titles }
}

/**
 * Transform raw meetup data into display-ready structures.
 * For each group: computes monthly counts, derives meetup page URL from
 * the first event's eventUrl, computes eventCount and goalMet.
 */
export function computeCommunityGoalsData(
  groups: RawMeetupGroup[],
  year: number,
): MeetupGroupDisplay[] {
  return groups.map((group) => {
    const allEvents = getAllEvents(group)
    const { counts: monthlyCounts, titles: monthlyEventTitles } = computeMonthlyEventCounts(allEvents, year)
    const eventCount = monthlyCounts.reduce((sum, c) => sum + c, 0)

    const eventsInYear = allEvents.filter((e) => extractYear(e.dateTime) === year)
    const now = new Date()
    const pastEventCount = eventsInYear.filter((e) => new Date(e.dateTime) < now).length
    const totalRsvps = eventsInYear.reduce((sum, e) => sum + e.rsvps.totalCount, 0)

    const firstEventWithUrl = allEvents.find((e) => e.eventUrl)
    const meetupPageUrl = firstEventWithUrl
      ? deriveMeetupPageUrl(firstEventWithUrl.eventUrl)
      : null

    return {
      id: group.id,
      name: group.name,
      city: group.city,
      country: group.country,
      meetupPageUrl,
      eventCount,
      pastEventCount,
      totalRsvps,
      memberCount: group.memberships.totalCount,
      foundedDate: group.foundedDate,
      goalMet: pastEventCount >= 7,
      monthlyCounts,
      monthlyEventTitles,
    }
  })
}
