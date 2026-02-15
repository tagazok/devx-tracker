export interface RawMeetupEvent {
  id: string
  title: string
  description: string
  dateTime: string
  endTime: string
  eventUrl: string
  rsvps: {
    totalCount: number
  }
}

export interface SocialNetwork {
  identifier: string
  service: string
  url: string
}

export interface Organizer {
  name: string
  email: string
  memberUrl: string
  memberPhoto: {
    standardUrl: string
  }
}

export interface GroupAnalytics {
  memberCount: number
  rsvpCount: number
  eventsThisYear: number
  plannedEvents: number
  averageAge: number
  averageRsvpPerEvent: number
  genderMembershipRatios?: {
    maleRatio: number
    femaleRatio: number
    otherRatio: number
    unknownRatio: number
  }
  genderRatio?: {
    male: number
    female: number
    other: number
  }
}

export interface RawMeetupGroup {
  id: string
  name: string
  city: string
  country: string
  description: string
  foundedDate: string
  proNetwork: string | null
  memberships: {
    totalCount: number
  }
  socialNetworks: SocialNetwork[]
  orgs: {
    edges: Array<{
      node: Organizer
    }>
  }
  groupAnalytics: GroupAnalytics | null
  pastEvents: {
    edges: { node: RawMeetupEvent }[]
  }
  upcomingEvents: {
    edges: { node: RawMeetupEvent }[]
  }
}

export interface MeetupGroupDisplay {
  id: string
  name: string
  city: string
  country: string
  meetupPageUrl: string | null
  eventCount: number
  pastEventCount: number
  totalRsvps: number
  memberCount: number
  foundedDate: string
  goalMet: boolean
  monthlyCounts: number[] // length 12, index 0 = January
  monthlyEventTitles: string[][] // length 12, each entry is an array of event titles for that month
}
