<script setup lang="ts">
import { computed, ref } from 'vue'
import { computeCommunityGoalsData, getAllEvents, extractYear } from '../utils/communityGoalsHelpers'
import type { RawMeetupGroup } from '../types/meetup'
import MeetupTimeline from './MeetupTimeline.vue'
import EventListDialog from './EventListDialog.vue'
import GroupDetailsDialog from './GroupDetailsDialog.vue'

const props = defineProps<{ meetups: RawMeetupGroup[] }>()

const countryData: Record<string, { name: string; deu: string }> = {
  // Europe South
  fr: { name: 'France', deu: 'Europe South' },
  es: { name: 'Spain', deu: 'Europe South' },
  pt: { name: 'Portugal', deu: 'Europe South' },
  it: { name: 'Italy', deu: 'Europe South' },
  il: { name: 'Israel', deu: 'Europe South' },
  // Europe North & UKI
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
  // Europe Central
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
  // SSA
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
  // MENAT
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

const deuOrder = ['Europe Central', 'Europe North & UKI', 'Europe South', 'MENAT', 'SSA']

function countryName(code: string): string {
  return countryData[code.toLowerCase()]?.name ?? code
}

function countryDeu(code: string): string {
  return countryData[code.toLowerCase()]?.deu ?? 'Other'
}

function formatFoundedDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `${month} ${year}`
}

function getLatestEventDate(groupId: string): string {
  const group = props.meetups.find(g => g.id === groupId)
  if (!group || group.pastEvents.edges.length === 0) return ''
  
  // Get the last event from the pastEvents array
  const lastEvent = group.pastEvents.edges[group.pastEvents.edges.length - 1]
  const date = new Date(lastEvent.node.dateTime)
  if (isNaN(date.getTime())) return ''
  
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  return `${month} ${year}`
}

function isLastEventOld(groupId: string): boolean {
  const group = props.meetups.find(g => g.id === groupId)
  if (!group || group.pastEvents.edges.length === 0) return false
  
  // Get the last event from the pastEvents array
  const lastEvent = group.pastEvents.edges[group.pastEvents.edges.length - 1]
  const lastEventDate = new Date(lastEvent.node.dateTime)
  if (isNaN(lastEventDate.getTime())) return false
  
  // Check if more than 12 months ago
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate())
  
  return lastEventDate < twelveMonthsAgo
}

interface CountryStats {
  groupCount: number
  pastEvents: number
  totalRsvps: number
}

interface DeuSection {
  deu: string
  groups: import('../types/meetup').MeetupGroupDisplay[]
  countryStats: Record<string, CountryStats>
  summary: {
    countries: number
    groups: number
    pastEvents: number
    upcomingEvents: number
    totalRsvps: number
    totalMembers: number
    goalMet: number
    goalNotMet: number
    goalPct: number
    oneAway: number
    zeroEvents: number
    zeroEventsPct: number
  }
}

const currentYear = new Date().getFullYear()

const groups = computed(() =>
  computeCommunityGoalsData(props.meetups, currentYear)
    .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name))
)

const selectedGroup = ref<RawMeetupGroup | null>(null)
const selectedGroupForDetails = ref<RawMeetupGroup | null>(null)
const goalFilter = ref('')
const deuFilter = ref('')
const countryFilter = ref('')

const availableDeus = computed(() => {
  const deus = new Set(groups.value.map((g) => countryDeu(g.country)))
  return [...deus].sort()
})

const availableCountries = computed(() => {
  let source = groups.value
  if (deuFilter.value) source = source.filter((g) => countryDeu(g.country) === deuFilter.value)
  const codes = new Set(source.map((g) => g.country))
  return [...codes]
    .map((c) => ({ code: c, name: countryName(c) }))
    .sort((a, b) => a.name.localeCompare(b.name))
})

function onDeuChange() {
  countryFilter.value = ''
}

const filteredGroups = computed(() => {
  let result = groups.value
  if (deuFilter.value) result = result.filter((g) => countryDeu(g.country) === deuFilter.value)
  if (countryFilter.value) result = result.filter((g) => g.country === countryFilter.value)
  if (goalFilter.value === 'met') result = result.filter((g) => g.goalMet)
  if (goalFilter.value === 'not-met') result = result.filter((g) => !g.goalMet)
  if (goalFilter.value === 'zero') result = result.filter((g) => g.pastEventCount === 0)
  return result
})

const deuSections = computed<DeuSection[]>(() => {
  const byDeu = new Map<string, import('../types/meetup').MeetupGroupDisplay[]>()
  for (const g of filteredGroups.value) {
    const deu = countryDeu(g.country)
    if (!byDeu.has(deu)) byDeu.set(deu, [])
    byDeu.get(deu)!.push(g)
  }
  // Sort sections by predefined order, unknown DEUs go last
  return [...byDeu.entries()]
    .sort(([a], [b]) => {
      const ia = deuOrder.indexOf(a)
      const ib = deuOrder.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
    .map(([deu, sectionGroups]) => {
      const sorted = sectionGroups.sort((a, b) => countryName(a.country).localeCompare(countryName(b.country)) || a.name.localeCompare(b.name))
      const countryStats: Record<string, CountryStats> = {}
      for (const g of sorted) {
        const c = g.country
        if (!countryStats[c]) countryStats[c] = { groupCount: 0, pastEvents: 0, totalRsvps: 0 }
        countryStats[c].groupCount++
        countryStats[c].pastEvents += g.pastEventCount
        countryStats[c].totalRsvps += g.totalRsvps
      }
      const countries = Object.keys(countryStats).length
      const totalGroups = sorted.length
      const pastEvents = sorted.reduce((s, g) => s + g.pastEventCount, 0)
      const upcomingEvents = sorted.reduce((s, g) => s + (g.eventCount - g.pastEventCount), 0)
      const totalRsvps = sorted.reduce((s, g) => s + g.totalRsvps, 0)
      const totalMembers = sorted.reduce((s, g) => s + g.memberCount, 0)
      const goalMet = sorted.filter((g) => g.goalMet).length
      const goalNotMet = totalGroups - goalMet
      const goalPct = totalGroups > 0 ? Math.round((goalMet / totalGroups) * 100) : 0
      const oneAway = sorted.filter((g) => !g.goalMet && g.pastEventCount === 6).length
      const zeroEvents = sorted.filter((g) => g.pastEventCount === 0).length
      const zeroEventsPct = totalGroups > 0 ? Math.round((zeroEvents / totalGroups) * 100) : 0
      return {
        deu,
        groups: sorted,
        countryStats,
        summary: { countries, groups: totalGroups, pastEvents, upcomingEvents, totalRsvps, totalMembers, goalMet, goalNotMet, goalPct, oneAway, zeroEvents, zeroEventsPct },
      }
    })
})

function openDialog(groupId: string) {
  const raw = props.meetups.find((g) => g.id === groupId) ?? null
  selectedGroup.value = raw
}

function closeDialog() {
  selectedGroup.value = null
}

function openDetailsDialog(groupId: string) {
  const raw = props.meetups.find((g) => g.id === groupId) ?? null
  selectedGroupForDetails.value = raw
}

function closeDetailsDialog() {
  selectedGroupForDetails.value = null
}

const selectedGroupEvents = computed(() => {
  if (!selectedGroup.value) return []
  return getAllEvents(selectedGroup.value).filter(
    (e) => extractYear(e.dateTime) === currentYear,
  )
})
</script>

<template>
  <div class="community-goals-panel">
      <div class="filters">
        <select v-model="deuFilter" class="filter-select" @change="onDeuChange">
          <option value="">All DEUs</option>
          <option v-for="d in availableDeus" :key="d" :value="d">{{ d }}</option>
        </select>
        <select v-model="countryFilter" class="filter-select">
          <option value="">All countries</option>
          <option v-for="c in availableCountries" :key="c.code" :value="c.code">{{ c.name }}</option>
        </select>
        <select v-model="goalFilter" class="filter-select">
          <option value="">All groups</option>
          <option value="met">Goal met</option>
          <option value="not-met">Goal not met</option>
          <option value="zero">Have done 0 events</option>
        </select>
      </div>
      <template v-for="section in deuSections" :key="section.deu">
        <div class="deu-label">{{ section.deu }}</div>
        <div class="deu-summary">
          <span>🌍 {{ section.summary.countries }} countries</span>
          <span>👥 {{ section.summary.groups }} groups</span>
          <span>👤 {{ section.summary.totalMembers.toLocaleString() }} members</span>
          <span>📅 {{ section.summary.pastEvents }} past events</span>
          <span>🔜 {{ section.summary.upcomingEvents }} upcoming</span>
          <span>🎟️ {{ section.summary.totalRsvps.toLocaleString() }} RSVPs</span>
        </div>
        <div class="deu-summary deu-summary-goals">
          <span class="goal-met">✓ {{ section.summary.goalMet }} met goal ({{ section.summary.goalPct }}%)</span>
          <span class="goal-not-met">✗ {{ section.summary.goalNotMet }} not met</span>
          <span v-if="section.summary.oneAway > 0" class="goal-one-away">⚡ {{ section.summary.oneAway }} just 1 event away</span>
          <span v-if="section.summary.zeroEvents > 0" class="goal-zero">⚠️ {{ section.summary.zeroEvents }} with 0 events ({{ section.summary.zeroEventsPct }}%)</span>
        </div>
        <template v-for="(group, index) in section.groups" :key="group.id">
          <div
            v-if="index === 0 || group.country !== section.groups[index - 1].country"
            class="country-label"
          >
            {{ countryName(group.country) }}
            <span class="country-stats">
              — {{ section.countryStats[group.country].groupCount }} groups · {{ section.countryStats[group.country].pastEvents }} events · {{ section.countryStats[group.country].totalRsvps }} RSVPs
            </span>
          </div>
          <div class="group-row" @click="openDetailsDialog(group.id)">
          <div class="group-info">
            <div class="group-header">
              <span class="group-name">{{ group.name }}</span>
              <a
                v-if="group.meetupPageUrl"
                :href="group.meetupPageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="meetup-link"
                @click.stop
              >
                meetup page ↗
              </a>
            </div>
            <div class="group-meta">
              <button
                class="event-count event-count-clickable"
                @click.stop="openDialog(group.id)"
              >
                📅 {{ group.pastEventCount }} events
                <span 
                  v-if="group.pastEventCount === 0 && getLatestEventDate(group.id)" 
                  class="last-event-date"
                  :class="{ 'last-event-old': isLastEventOld(group.id) }"
                >
                  (last: {{ getLatestEventDate(group.id) }})
                </span>
              </button>
              <span class="rsvp-count">👥 {{ group.totalRsvps }} RSVPs</span>
              <span class="member-count">👤 {{ group.memberCount.toLocaleString() }} members</span>
              <span class="founded-date">📆 {{ formatFoundedDate(group.foundedDate) }}</span>
              <span
                class="goal-indicator"
                :class="group.goalMet ? 'goal-met' : 'goal-not-met'"
              >
                  {{ group.goalMet ? '✓ Goal met' : '' }}
              </span>
            </div>
          </div>
          <MeetupTimeline :monthly-counts="group.monthlyCounts" :monthly-event-titles="group.monthlyEventTitles" :year="currentYear" />
        </div>
        </template>
      </template>
      <p v-if="deuSections.length === 0" class="no-data">No meetup groups found.</p>
    <EventListDialog
      v-if="selectedGroup"
      :group-name="selectedGroup.name"
      :events="selectedGroupEvents"
      @close="closeDialog"
    />
    <GroupDetailsDialog
      v-if="selectedGroupForDetails"
      :group="selectedGroupForDetails"
      @close="closeDetailsDialog"
    />
  </div>
</template>

<style scoped>
.community-goals-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #334155;
  background: #fff;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.error {
  color: #dc2626;
  font-weight: 500;
}

.group-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .group-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

.group-row:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

@media (max-width: 768px) {
  .group-info {
    width: 100%;
  }
}

.group-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.group-name {
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meetup-link {
  font-size: 0.8rem;
  color: #3b82f6;
  text-decoration: none;
  white-space: nowrap;
}

.meetup-link:hover {
  text-decoration: underline;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .group-meta {
    gap: 8px;
    font-size: 0.8rem;
  }
}

.event-count,
.rsvp-count,
.member-count,
.founded-date {
  color: #64748b;
}

.event-count-clickable {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: inherit;
  color: #64748b;
  cursor: pointer;
}

.event-count-clickable:hover,
.event-count-clickable:focus {
  text-decoration: underline;
  color: #3b82f6;
  outline: none;
}

.last-event-date {
  font-size: 0.85em;
  color: #94a3b8;
  font-style: italic;
}

.last-event-old {
  color: #dc2626;
  font-weight: 600;
}

.goal-indicator {
  font-weight: 500;
  font-size: 0.8rem;
}

.goal-met {
  color: #16a34a;
}

.goal-not-met {
  color: #dc2626;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
}

.country-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 0 4px;
  margin-top: 4px;
}

.country-stats {
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  color: #94a3b8;
  font-size: 0.75rem;
}

.deu-label {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  padding: 16px 0 4px;
  margin-top: 8px;
  border-bottom: 2px solid #e2e8f0;
}

.deu-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: #64748b;
  padding: 4px 0;
}

.deu-summary-goals {
  padding-bottom: 4px;
}

.goal-one-away {
  color: #d97706;
}

.goal-zero {
  color: #dc2626;
}
</style>
