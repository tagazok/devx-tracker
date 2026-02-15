<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ticket } from '../types/ticket'
import type { RawMeetupGroup } from '../types/meetup'
import { computeStatistics } from '../utils/statisticsHelpers'
import { computeCommunityGoalsData, getAllEvents } from '../utils/communityGoalsHelpers'
import { getCfpStatus, getCustomFieldDate } from '../utils/ticketHelpers'
import DateRangePicker from './DateRangePicker.vue'

const props = defineProps<{
  tickets: Ticket[]
  meetups?: RawMeetupGroup[]
}>()

// --- Date range filter ---
const dateFrom = ref('')
const dateTo = ref('')

function isInDateRange(dateStr: string): boolean {
  if (!dateStr) return false
  const d = dateStr.slice(0, 10) // YYYY-MM-DD
  if (dateFrom.value && d < dateFrom.value) return false
  if (dateTo.value && d > dateTo.value) return false
  return true
}

const hasDateFilter = computed(() => dateFrom.value !== '' || dateTo.value !== '')

const filteredTickets = computed(() => {
  if (!hasDateFilter.value) return props.tickets
  return props.tickets.filter(t => {
    const d = getCustomFieldDate(t, 'date')
    return isInDateRange(d)
  })
})

const stats = computed(() => computeStatistics(filteredTickets.value))

const hasTickets = computed(() => filteredTickets.value.length > 0)

// --- Ticket KPI stats per DEU ---
const STUDENTS_LABEL = 'Segment: Students'
const RECAP_LABEL = 'Program: re:Invent re:Cap'

interface TicketDeuRow {
  deu: string
  resolved: number
  future: number
  cfpSubmitted: number
  cfpAccepted: number
  students: number
  resolved3P: number
  resolvedCommunity: number
  resolvedFirstParty: number
  resolvedInAccount: number
  future3P: number
  futureCommunity: number
  futureFirstParty: number
  futureInAccount: number
}

const ticketDeuOrder = ['Europe Central', 'Europe North', 'Europe South', 'MENAT', 'SSA', 'UKI']

const ticketKpiStats = computed(() => {
  const deuMap = new Map<string, { resolved: number; future: number; cfpSubmitted: number; cfpAccepted: number; students: number; resolved3P: number; resolvedCommunity: number; resolvedFirstParty: number; resolvedInAccount: number; future3P: number; futureCommunity: number; futureFirstParty: number; futureInAccount: number }>()
  let totalResolved = 0
  let totalFuture = 0
  let totalCfpSubmitted = 0
  let totalCfpAccepted = 0
  let totalStudents = 0
  let totalRecap = 0
  let total3P = 0
  let totalCommunity = 0
  let totalFirstParty = 0
  let totalInAccount = 0
  let totalFuture3P = 0
  let totalFutureCommunity = 0
  let totalFutureFirstParty = 0
  let totalFutureInAccount = 0

  const today = new Date()
  today.setHours(23, 59, 59, 999)

  for (const t of filteredTickets.value) {
    const deus = t.labels.filter(l => l.startsWith('DEU: ')).map(l => l.replace('DEU: ', ''))
    const status = t.extensions.tt.status
    const isResolved = status === 'Resolved'
    const cfp = getCfpStatus(t)
    const isStudent = t.labels.includes(STUDENTS_LABEL)
    const isRecap = t.labels.includes(RECAP_LABEL)
    const organizer = (t.customFields.string?.find(f => f.id === 'activity_organizer')?.value ?? '').trim()

    // Determine if event is in the future based on its date field
    const eventDateStr = getCustomFieldDate(t, 'date')
    const eventDate = eventDateStr ? new Date(eventDateStr) : null
    const isFuture = eventDate ? eventDate > today : false
    const isFutureAccepted = isFuture && t.extensions.tt.computedPendingReason === 'Accepted'

    if (isResolved && !isFuture) {
      // Past or today + Resolved: count as delivered
      totalResolved++
      if (organizer === '3P') total3P++
      if (organizer === 'AWS Community') totalCommunity++
      if (organizer === 'AWS first party') totalFirstParty++
      if (organizer === 'In account customers') totalInAccount++
    } else if (isFutureAccepted) {
      // Future + computedPendingReason=Accepted: count as upcoming
      totalFuture++
      if (organizer === '3P') totalFuture3P++
      if (organizer === 'AWS Community') totalFutureCommunity++
      if (organizer === 'AWS first party') totalFutureFirstParty++
      if (organizer === 'In account customers') totalFutureInAccount++
    }

    if (cfp === 'submitted') totalCfpSubmitted++
    if (cfp === 'accepted') totalCfpAccepted++
    if (isStudent) totalStudents++
    if (isRecap) totalRecap++

    for (const deu of deus) {
      if (!deuMap.has(deu)) deuMap.set(deu, { resolved: 0, future: 0, cfpSubmitted: 0, cfpAccepted: 0, students: 0, resolved3P: 0, resolvedCommunity: 0, resolvedFirstParty: 0, resolvedInAccount: 0, future3P: 0, futureCommunity: 0, futureFirstParty: 0, futureInAccount: 0 })
      const row = deuMap.get(deu)!

      if (isResolved && !isFuture) {
        row.resolved++
        if (organizer === '3P') row.resolved3P++
        if (organizer === 'AWS Community') row.resolvedCommunity++
        if (organizer === 'AWS first party') row.resolvedFirstParty++
        if (organizer === 'In account customers') row.resolvedInAccount++
      } else if (isFutureAccepted) {
        row.future++
        if (organizer === '3P') row.future3P++
        if (organizer === 'AWS Community') row.futureCommunity++
        if (organizer === 'AWS first party') row.futureFirstParty++
        if (organizer === 'In account customers') row.futureInAccount++
      }

      if (cfp === 'submitted') row.cfpSubmitted++
      if (cfp === 'accepted') row.cfpAccepted++
      if (isStudent) row.students++
    }
  }

  const rows: TicketDeuRow[] = [...deuMap.entries()]
    .sort(([a], [b]) => {
      const ia = ticketDeuOrder.indexOf(a)
      const ib = ticketDeuOrder.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    .map(([deu, d]) => ({ deu, ...d }))

  return { rows, totalResolved, totalFuture, totalCfpSubmitted, totalCfpAccepted, totalStudents, totalRecap, total3P, totalCommunity, totalFirstParty, totalInAccount, totalFuture3P, totalFutureCommunity, totalFutureFirstParty, totalFutureInAccount }
})

// --- Country / DEU mapping (shared with CommunityGoalsPanel) ---
const countryData: Record<string, { name: string; deu: string }> = {
  fr: { name: 'France', deu: 'Europe South' },
  es: { name: 'Spain', deu: 'Europe South' },
  pt: { name: 'Portugal', deu: 'Europe South' },
  it: { name: 'Italy', deu: 'Europe South' },
  il: { name: 'Israel', deu: 'Europe South' },
  be: { name: 'Belgium', deu: 'Europe North & UKI' },
  lu: { name: 'Luxembourg', deu: 'Europe North & UKI' },
  nl: { name: 'Netherlands', deu: 'Europe North & UKI' },
  gb: { name: 'United Kingdom', deu: 'Europe North & UKI' },
  ie: { name: 'Ireland', deu: 'Europe North & UKI' },
  dk: { name: 'Denmark', deu: 'Europe North & UKI' },
  fi: { name: 'Finland', deu: 'Europe North & UKI' },
  lv: { name: 'Latvia', deu: 'Europe North & UKI' },
  no: { name: 'Norway', deu: 'Europe North & UKI' },
  is: { name: 'Iceland', deu: 'Europe North & UKI' },
  se: { name: 'Sweden', deu: 'Europe North & UKI' },
  am: { name: 'Armenia', deu: 'Europe Central' },
  ge: { name: 'Georgia', deu: 'Europe Central' },
  kz: { name: 'Kazakhstan', deu: 'Europe Central' },
  kg: { name: 'Kyrgyzstan', deu: 'Europe Central' },
  ua: { name: 'Ukraine', deu: 'Europe Central' },
  uz: { name: 'Uzbekistan', deu: 'Europe Central' },
  az: { name: 'Azerbaijan', deu: 'Europe Central' },
  al: { name: 'Albania', deu: 'Europe Central' },
  ba: { name: 'Bosnia and Herzegovina', deu: 'Europe Central' },
  bg: { name: 'Bulgaria', deu: 'Europe Central' },
  cy: { name: 'Cyprus', deu: 'Europe Central' },
  cz: { name: 'Czechia', deu: 'Europe Central' },
  gr: { name: 'Greece', deu: 'Europe Central' },
  hu: { name: 'Hungary', deu: 'Europe Central' },
  xk: { name: 'Kosovo', deu: 'Europe Central' },
  mk: { name: 'North Macedonia', deu: 'Europe Central' },
  mt: { name: 'Malta', deu: 'Europe Central' },
  md: { name: 'Moldova', deu: 'Europe Central' },
  me: { name: 'Montenegro', deu: 'Europe Central' },
  pl: { name: 'Poland', deu: 'Europe Central' },
  ro: { name: 'Romania', deu: 'Europe Central' },
  rs: { name: 'Serbia', deu: 'Europe Central' },
  sk: { name: 'Slovakia', deu: 'Europe Central' },
  si: { name: 'Slovenia', deu: 'Europe Central' },
  hr: { name: 'Croatia', deu: 'Europe Central' },
  at: { name: 'Austria', deu: 'Europe Central' },
  ch: { name: 'Switzerland', deu: 'Europe Central' },
  de: { name: 'Germany', deu: 'Europe Central' },
  cm: { name: 'Cameroon', deu: 'SSA' },
  gh: { name: 'Ghana', deu: 'SSA' },
  ke: { name: 'Kenya', deu: 'SSA' },
  lr: { name: 'Liberia', deu: 'SSA' },
  ml: { name: 'Mali', deu: 'SSA' },
  mu: { name: 'Mauritius', deu: 'SSA' },
  ng: { name: 'Nigeria', deu: 'SSA' },
  sn: { name: 'Senegal', deu: 'SSA' },
  za: { name: 'South Africa', deu: 'SSA' },
  tg: { name: 'Togo', deu: 'SSA' },
  zw: { name: 'Zimbabwe', deu: 'SSA' },
  mz: { name: 'Mozambique', deu: 'SSA' },
  rw: { name: 'Rwanda', deu: 'SSA' },
  zm: { name: 'Zambia', deu: 'SSA' },
  ao: { name: 'Angola', deu: 'SSA' },
  gn: { name: 'Guinea', deu: 'SSA' },
  ci: { name: "Côte d'Ivoire", deu: 'SSA' },
  ne: { name: 'Niger', deu: 'SSA' },
  ug: { name: 'Uganda', deu: 'SSA' },
  et: { name: 'Ethiopia', deu: 'SSA' },
  cd: { name: 'Democratic Republic of the Congo', deu: 'SSA' },
  cg: { name: 'Republic of the Congo', deu: 'SSA' },
  iq: { name: 'Iraq', deu: 'MENAT' },
  jo: { name: 'Jordan', deu: 'MENAT' },
  lb: { name: 'Lebanon', deu: 'MENAT' },
  ps: { name: 'Palestine', deu: 'MENAT' },
  qa: { name: 'Qatar', deu: 'MENAT' },
  sa: { name: 'Saudi Arabia', deu: 'MENAT' },
  tn: { name: 'Tunisia', deu: 'MENAT' },
  ae: { name: 'United Arab Emirates', deu: 'MENAT' },
  eg: { name: 'Egypt', deu: 'MENAT' },
  ma: { name: 'Morocco', deu: 'MENAT' },
  tr: { name: 'Türkiye', deu: 'MENAT' },
  sy: { name: 'Syria', deu: 'MENAT' },
}

function countryName(code: string): string {
  return countryData[code.toLowerCase()]?.name ?? code
}
function countryDeu(code: string): string {
  return countryData[code.toLowerCase()]?.deu ?? 'Other'
}

const currentYear = new Date().getFullYear()

const groups = computed(() =>
  props.meetups ? computeCommunityGoalsData(props.meetups, currentYear) : []
)

const hasMeetups = computed(() => groups.value.length > 0)

// --- Global stats ---
const globalStats = computed(() => {
  const g = groups.value
  const total = g.length
  const goalMet = g.filter(x => x.goalMet).length
  const zeroEvents = g.filter(x => x.pastEventCount === 0).length
  const countries = new Set(g.map(x => x.country)).size
  const totalMembers = g.reduce((s, x) => s + x.memberCount, 0)

  // Events & RSVPs filtered by date range when active
  let pastEvents: number
  let totalRsvps: number
  let zeroEventsCount: number
  if (hasDateFilter.value && props.meetups) {
    let ev = 0, rv = 0
    const groupEventCounts = new Map<string, number>()
    for (const group of props.meetups) {
      let groupCount = 0
      for (const e of getAllEvents(group)) {
        if (new Date(e.dateTime) < new Date() && isInDateRange(e.dateTime)) {
          ev++
          rv += e.rsvps.totalCount
          groupCount++
        }
      }
      groupEventCounts.set(group.id, groupCount)
    }
    pastEvents = ev
    totalRsvps = rv
    zeroEventsCount = g.filter(x => (groupEventCounts.get(x.id) ?? 0) === 0).length
  } else {
    pastEvents = g.reduce((s, x) => s + x.pastEventCount, 0)
    totalRsvps = g.reduce((s, x) => s + x.totalRsvps, 0)
    zeroEventsCount = zeroEvents
  }

  return { total, goalMet, pastEvents, totalRsvps, totalMembers, zeroEvents: zeroEventsCount, countries, goalPct: total > 0 ? Math.round((goalMet / total) * 100) : 0 }
})

// --- Per-DEU stats ---
interface DeuStats {
  deu: string
  groups: number
  goalMet: number
  goalPct: number
  pastEvents: number
  totalRsvps: number
  totalMembers: number
  zeroEvents: number
  countries: number
}

const deuOrder = ['Europe Central', 'Europe North & UKI', 'Europe South', 'MENAT', 'SSA']

const deuStats = computed<DeuStats[]>(() => {
  const map = new Map<string, typeof groups.value>()
  for (const g of groups.value) {
    const deu = countryDeu(g.country)
    if (!map.has(deu)) map.set(deu, [])
    map.get(deu)!.push(g)
  }

  // Pre-compute filtered events/RSVPs per DEU when date filter active
  const filteredDeuEvents = new Map<string, { events: number; rsvps: number }>()
  const filteredGroupEventCounts = new Map<string, number>()
  if (hasDateFilter.value && props.meetups) {
    for (const group of props.meetups) {
      const deu = countryDeu(group.country)
      if (!filteredDeuEvents.has(deu)) filteredDeuEvents.set(deu, { events: 0, rsvps: 0 })
      const acc = filteredDeuEvents.get(deu)!
      let groupCount = 0
      for (const e of getAllEvents(group)) {
        if (new Date(e.dateTime) < new Date() && isInDateRange(e.dateTime)) {
          acc.events++
          acc.rsvps += e.rsvps.totalCount
          groupCount++
        }
      }
      filteredGroupEventCounts.set(group.id, groupCount)
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => {
      const ia = deuOrder.indexOf(a)
      const ib = deuOrder.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    .map(([deu, gs]) => ({
      deu,
      groups: gs.length,
      goalMet: gs.filter(x => x.goalMet).length,
      goalPct: gs.length > 0 ? Math.round((gs.filter(x => x.goalMet).length / gs.length) * 100) : 0,
      pastEvents: hasDateFilter.value ? (filteredDeuEvents.get(deu)?.events ?? 0) : gs.reduce((s, x) => s + x.pastEventCount, 0),
      totalRsvps: hasDateFilter.value ? (filteredDeuEvents.get(deu)?.rsvps ?? 0) : gs.reduce((s, x) => s + x.totalRsvps, 0),
      totalMembers: gs.reduce((s, x) => s + x.memberCount, 0),
      zeroEvents: hasDateFilter.value ? gs.filter(x => (filteredGroupEventCounts.get(x.id) ?? 0) === 0).length : gs.filter(x => x.pastEventCount === 0).length,
      countries: new Set(gs.map(x => x.country)).size,
    }))
})

// --- Per-country stats ---
interface CountryStatsRow {
  code: string
  name: string
  deu: string
  groups: number
  goalMet: number
  goalPct: number
  pastEvents: number
  totalRsvps: number
}
const countryOpen = ref(false)
const rawDataOpen = ref(false)

// Sorting state for country table
const countrySortBy = ref<'name' | 'deu' | 'groups' | 'pastEvents' | 'totalRsvps' | 'goalMet'>('name')
const countrySortOrder = ref<'asc' | 'desc'>('asc')

function sortCountryBy(column: typeof countrySortBy.value) {
  if (countrySortBy.value === column) {
    countrySortOrder.value = countrySortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    countrySortBy.value = column
    countrySortOrder.value = 'asc'
  }
}

const countryStats = computed<CountryStatsRow[]>(() => {
  const map = new Map<string, typeof groups.value>()
  for (const g of groups.value) {
    if (!map.has(g.country)) map.set(g.country, [])
    map.get(g.country)!.push(g)
  }

  // Pre-compute filtered events/RSVPs per country when date filter active
  const filteredCountryEvents = new Map<string, { events: number; rsvps: number }>()
  if (hasDateFilter.value && props.meetups) {
    for (const group of props.meetups) {
      const cc = group.country
      if (!filteredCountryEvents.has(cc)) filteredCountryEvents.set(cc, { events: 0, rsvps: 0 })
      const acc = filteredCountryEvents.get(cc)!
      for (const e of getAllEvents(group)) {
        if (new Date(e.dateTime) < new Date() && isInDateRange(e.dateTime)) {
          acc.events++
          acc.rsvps += e.rsvps.totalCount
        }
      }
    }
  }

  return [...map.entries()]
    .map(([code, gs]) => ({
      code,
      name: countryName(code),
      deu: countryDeu(code),
      groups: gs.length,
      goalMet: gs.filter(x => x.goalMet).length,
      goalPct: gs.length > 0 ? Math.round((gs.filter(x => x.goalMet).length / gs.length) * 100) : 0,
      pastEvents: hasDateFilter.value ? (filteredCountryEvents.get(code)?.events ?? 0) : gs.reduce((s, x) => s + x.pastEventCount, 0),
      totalRsvps: hasDateFilter.value ? (filteredCountryEvents.get(code)?.rsvps ?? 0) : gs.reduce((s, x) => s + x.totalRsvps, 0),
    }))
    .sort((a, b) => {
      let comparison = 0
      switch (countrySortBy.value) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'deu':
          comparison = a.deu.localeCompare(b.deu)
          break
        case 'groups':
          comparison = a.groups - b.groups
          break
        case 'pastEvents':
          comparison = a.pastEvents - b.pastEvents
          break
        case 'totalRsvps':
          comparison = a.totalRsvps - b.totalRsvps
          break
        case 'goalMet':
          comparison = a.goalMet - b.goalMet
          break
      }
      return countrySortOrder.value === 'asc' ? comparison : -comparison
    })
})


</script>

<template>
  <div class="statistics-panel">
    <!-- Date Range Filter -->
    <section class="date-range-filter" aria-label="Date range filter">
      <DateRangePicker v-model:startDate="dateFrom" v-model:endDate="dateTo" />
    </section>
    <!-- Ticket KPI Overview -->
    <template v-if="hasTickets">
    <section class="community-stats" aria-label="Ticket KPI overview">
      <h2 class="section-title">Activity KPIs — Overview</h2>
      <div class="kpi-cards">
        <div class="stat-card">
          <span class="stat-card-value">
            {{ ticketKpiStats.totalResolved }}
            <span v-if="ticketKpiStats.totalFuture > 0" class="stat-card-pending">(+{{ ticketKpiStats.totalFuture }})</span>
          </span>
          <span class="stat-card-label">Delivered</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">{{ ticketKpiStats.totalCfpSubmitted }}</span>
          <span class="stat-card-label">CFP Submitted</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">{{ ticketKpiStats.totalCfpAccepted }}</span>
          <span class="stat-card-label">CFP Accepted</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">{{ ticketKpiStats.totalStudents }}</span>
          <span class="stat-card-label">Student Events</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-value">{{ ticketKpiStats.totalRecap }}</span>
          <span class="stat-card-label">re:Cap</span>
        </div>
      </div>
    </section>

    <!-- Ticket KPI per DEU -->
    <section class="community-stats" aria-label="Ticket KPIs per DEU">
      <h2 class="section-title">Activity KPIs — Per DEU</h2>
      <div class="kpi-deu-grid">
        <div v-for="d in ticketKpiStats.rows" :key="d.deu" class="deu-card">
          <div class="deu-card-header">{{ d.deu }}</div>
          <div class="deu-card-body">
            <div class="deu-metric">
              <span class="deu-metric-label">Delivered</span>
              <span class="deu-metric-value">
                {{ d.resolved }}
                <span v-if="d.future > 0" class="deu-metric-pending">(+{{ d.future }})</span>
              </span>
            </div>
            <div class="deu-sub-metrics">
              <div class="deu-sub-item">
                <span>3P</span>
                <span>
                  {{ d.resolved3P }}
                  <span v-if="d.future3P > 0" class="deu-sub-pending">(+{{ d.future3P }})</span>
                </span>
              </div>
              <div class="deu-sub-item">
                <span>Community</span>
                <span>
                  {{ d.resolvedCommunity }}
                  <span v-if="d.futureCommunity > 0" class="deu-sub-pending">(+{{ d.futureCommunity }})</span>
                </span>
              </div>
              <div class="deu-sub-item">
                <span>First Party</span>
                <span>
                  {{ d.resolvedFirstParty }}
                  <span v-if="d.futureFirstParty > 0" class="deu-sub-pending">(+{{ d.futureFirstParty }})</span>
                </span>
              </div>
              <div class="deu-sub-item">
                <span>In Account</span>
                <span>
                  {{ d.resolvedInAccount }}
                  <span v-if="d.futureInAccount > 0" class="deu-sub-pending">(+{{ d.futureInAccount }})</span>
                </span>
              </div>
            </div>
            <div class="deu-metric">
              <span class="deu-metric-label">CFP Submitted</span>
              <span class="deu-metric-value">{{ d.cfpSubmitted }}</span>
            </div>
            <div class="deu-metric">
              <span class="deu-metric-label">CFP Accepted</span>
              <span class="deu-metric-value">{{ d.cfpAccepted }}</span>
            </div>
            <div class="deu-metric">
              <span class="deu-metric-label">Student Events</span>
              <span class="deu-metric-value">{{ d.students }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </template>

    <!-- Raw Data (collapsible, only when tickets loaded) -->
    <section v-if="hasTickets" class="community-stats" aria-label="Raw ticket data">
      <h2 class="section-title collapsible-title" @click="rawDataOpen = !rawDataOpen">
        <span class="collapse-arrow" :class="{ open: rawDataOpen }">▶</span>
        Raw Data
      </h2>
      <template v-if="rawDataOpen">
        <section class="label-statistics" aria-label="Label statistics">
          <h2 class="section-title">Label Statistics</h2>
          <table v-if="stats.labelStats.length > 0" class="stats-table">
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Tickets</th>
                <th scope="col">Attendees</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.labelStats" :key="row.label">
                <td>{{ row.label }}</td>
                <td class="numeric">{{ row.ticketCount }}</td>
                <td class="numeric">{{ row.totalAttendees }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="no-data">No label data available.</p>
        </section>

        <section class="organizer-cross" aria-label="Organizer cross-tabulation">
          <h2 class="section-title">Organizer Cross-Tabulation</h2>
          <table v-if="stats.organizerCross.length > 0" class="stats-table">
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th v-for="org in stats.organizerNames" :key="org" scope="col">{{ org }}</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats.organizerCross" :key="row.label">
                <td>{{ row.label }}</td>
                <td v-for="org in stats.organizerNames" :key="org" class="numeric">
                  {{ row.counts[org] ?? 0 }}
                </td>
                <td class="numeric">{{ row.total }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="no-data">No organizer data available.</p>
        </section>
      </template>
    </section>

    <!-- Community Goals Statistics -->
    <template v-if="hasMeetups">
      <!-- Global Overview -->
      <section class="community-stats" aria-label="Community goals overview">
        <h2 class="section-title">Community Goals — Global Overview</h2>
        <div class="global-cards">
          <div class="stat-card">
            <span class="stat-card-value">{{ globalStats.total }}</span>
            <span class="stat-card-label">Groups</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-value">{{ globalStats.countries }}</span>
            <span class="stat-card-label">Countries</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-value">{{ globalStats.totalMembers.toLocaleString() }}</span>
            <span class="stat-card-label">Members</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-value">{{ globalStats.pastEvents }}</span>
            <span class="stat-card-label">Events</span>
          </div>
          <div class="stat-card">
            <span class="stat-card-value">{{ globalStats.totalRsvps.toLocaleString() }}</span>
            <span class="stat-card-label">RSVPs</span>
          </div>
          <div class="stat-card stat-card-goal">
            <span class="stat-card-value">{{ globalStats.goalPct }}%</span>
            <span class="stat-card-label">Goal Met</span>
            <span class="stat-card-sub">{{ globalStats.goalMet }} / {{ globalStats.total }}</span>
          </div>
          <div class="stat-card stat-card-warn">
            <span class="stat-card-value">{{ globalStats.zeroEvents }}</span>
            <span class="stat-card-label">Zero Events</span>
          </div>
        </div>
      </section>

      <!-- Per-DEU Stats -->
      <section class="community-stats" aria-label="Community goals per DEU">
        <h2 class="section-title">Community Goals — Per DEU</h2>
        <div class="deu-grid">
          <div v-for="d in deuStats" :key="d.deu" class="deu-card">
            <div class="deu-card-header">{{ d.deu }}</div>
            <div class="deu-card-body">
              <div class="deu-metric">
                <span class="deu-metric-label">Groups</span>
                <span class="deu-metric-value">{{ d.groups }}</span>
              </div>
              <div class="deu-metric">
                <span class="deu-metric-label">Countries</span>
                <span class="deu-metric-value">{{ d.countries }}</span>
              </div>
              <div class="deu-metric">
                <span class="deu-metric-label">Members</span>
                <span class="deu-metric-value">{{ d.totalMembers.toLocaleString() }}</span>
              </div>
              <div class="deu-metric">
                <span class="deu-metric-label">Events</span>
                <span class="deu-metric-value">{{ d.pastEvents }}</span>
              </div>
              <div class="deu-metric">
                <span class="deu-metric-label">RSVPs</span>
                <span class="deu-metric-value">{{ d.totalRsvps.toLocaleString() }}</span>
              </div>
              <div class="deu-goal-bar">
                <div class="deu-goal-label">
                  <span>Goal: {{ d.goalMet }}/{{ d.groups }} ({{ d.goalPct }}%)</span>
                  <span v-if="d.zeroEvents > 0" class="zero-warn">{{ d.zeroEvents }} inactive{{ hasDateFilter ? ' in range' : ' in ' + currentYear }} ({{ d.groups > 0 ? Math.round((d.zeroEvents / d.groups) * 100) : 0 }}%)</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: d.goalPct + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Per-Country Stats (collapsible) -->
      <section class="community-stats" aria-label="Community goals per country">
        <h2 class="section-title collapsible-title" @click="countryOpen = !countryOpen">
          <span class="collapse-arrow" :class="{ open: countryOpen }">▶</span>
          Community Goals — Per Country
        </h2>
        <div v-if="countryOpen" class="country-table-wrap">
          <table class="stats-table country-table">
            <thead>
              <tr>
                <th scope="col" class="sortable" @click="sortCountryBy('name')">
                  Country
                  <span class="sort-indicator" v-if="countrySortBy === 'name'">{{ countrySortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th scope="col" class="sortable" @click="sortCountryBy('deu')">
                  DEU
                  <span class="sort-indicator" v-if="countrySortBy === 'deu'">{{ countrySortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th scope="col" class="sortable" @click="sortCountryBy('groups')">
                  Groups
                  <span class="sort-indicator" v-if="countrySortBy === 'groups'">{{ countrySortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th scope="col" class="sortable" @click="sortCountryBy('pastEvents')">
                  Events
                  <span class="sort-indicator" v-if="countrySortBy === 'pastEvents'">{{ countrySortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th scope="col" class="sortable" @click="sortCountryBy('totalRsvps')">
                  RSVPs
                  <span class="sort-indicator" v-if="countrySortBy === 'totalRsvps'">{{ countrySortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
                <th scope="col" class="sortable" @click="sortCountryBy('goalMet')">
                  Goal Met
                  <span class="sort-indicator" v-if="countrySortBy === 'goalMet'">{{ countrySortOrder === 'asc' ? '▲' : '▼' }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in countryStats" :key="c.code">
                <td>{{ c.name }}</td>
                <td class="deu-cell">{{ c.deu }}</td>
                <td class="numeric">{{ c.groups }}</td>
                <td class="numeric">{{ c.pastEvents }}</td>
                <td class="numeric">{{ c.totalRsvps.toLocaleString() }}</td>
                <td class="numeric">
                  <span class="goal-pill" :class="c.goalPct === 100 ? 'goal-full' : c.goalPct >= 50 ? 'goal-half' : 'goal-low'">
                    {{ c.goalMet }}/{{ c.groups }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.statistics-panel {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.date-range-filter {
  display: flex;
  align-items: center;
  gap: 16px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 12px 0;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
}

.stats-table th,
.stats-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.stats-table th {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
  background: #f8fafc;
}

.stats-table td.numeric,
.stats-table th:not(:first-child) {
  text-align: right;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
}

/* --- Ticket KPI Cards --- */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  max-width: 100%;
}

@media (min-width: 1024px) {
  .kpi-cards {
    grid-template-columns: repeat(5, minmax(120px, 150px));
    justify-content: center;
  }
}

.stat-card-wide {
  grid-column: span 1;
}

.stat-card-subs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 6px;
  width: 100%;
}

.stat-sub-item {
  font-size: 0.72rem;
  color: #64748b;
  display: flex;
  justify-content: center;
}

/* --- DEU sub-metrics --- */
.deu-sub-metrics {
  padding-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-left: 2px solid #e2e8f0;
  margin-left: 4px;
}

.deu-sub-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #94a3b8;
}

.deu-sub-item span:last-child {
  font-weight: 500;
  color: #64748b;
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.deu-sub-pending {
  font-size: 0.7rem;
  font-weight: 500;
  color: #3b82f6;
}

.kpi-deu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

/* --- Community Goals Global Cards --- */
.global-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  max-width: 100%;
}

@media (min-width: 1200px) {
  .global-cards {
    grid-template-columns: repeat(7, minmax(120px, 150px));
    justify-content: center;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  text-align: center;
}

.stat-card-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-card-pending {
  font-size: 1rem;
  font-weight: 500;
  color: #3b82f6;
}

.stat-card-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin-top: 2px;
}

.stat-card-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
}

.stat-card-goal {
  border-color: #86efac;
  background: #f0fdf4;
}

.stat-card-goal .stat-card-value {
  color: #16a34a;
}

.stat-card-warn {
  border-color: #fecaca;
  background: #fef2f2;
}

.stat-card-warn .stat-card-value {
  color: #dc2626;
}

/* --- DEU Grid --- */
.deu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.deu-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.deu-card-header {
  padding: 10px 14px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #1e293b;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.deu-card-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.deu-metric {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.deu-metric-label {
  color: #64748b;
}

.deu-metric-value {
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.deu-metric-pending {
  font-size: 0.75rem;
  font-weight: 500;
  color: #3b82f6;
}

.deu-goal-bar {
  margin-top: 4px;
}

.deu-goal-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 4px;
}

.zero-warn {
  color: #dc2626;
  font-weight: 500;
}

.progress-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* --- Country Table --- */
.country-table-wrap {
  overflow-x: auto;
}

.country-table th,
.country-table td {
  white-space: nowrap;
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background: #f1f5f9;
}

.sort-indicator {
  display: inline-block;
  margin-left: 4px;
  font-size: 0.7rem;
  color: #64748b;
}

.collapsible-title {
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.collapsible-title:hover {
  color: #1e293b;
}

.collapse-arrow {
  display: inline-block;
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.collapse-arrow.open {
  transform: rotate(90deg);
}

.deu-cell {
  font-size: 0.8rem;
  color: #64748b;
}

.goal-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.goal-full {
  background: #dcfce7;
  color: #16a34a;
}

.goal-half {
  background: #fef9c3;
  color: #a16207;
}

.goal-low {
  background: #fef2f2;
  color: #dc2626;
}
</style>
