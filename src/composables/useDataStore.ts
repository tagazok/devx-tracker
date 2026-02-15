import { ref, computed } from 'vue'
import type { Ticket, TabId } from '../types/ticket'
import type { RawMeetupGroup } from '../types/meetup'

export interface UploadPayload {
  tickets?: Ticket[]
  meetups?: RawMeetupGroup[]
}

const tickets = ref<Ticket[]>([])
const meetups = ref<RawMeetupGroup[]>([])
const labelsReady = ref(false)

const hasTickets = computed(() => tickets.value.length > 0)
const hasMeetups = computed(() => meetups.value.length > 0)
const hasData = computed(() => hasTickets.value || hasMeetups.value)

const availableTabs = computed<TabId[]>(() => {
  const tabs: TabId[] = []
  if (hasData.value) {
    tabs.push('statistics')
  }
  if (hasTickets.value) {
    tabs.push('all', 'conferences', 'students')
  }
  if (hasMeetups.value) {
    tabs.push('community-goals')
  }
  if (hasData.value) {
    tabs.push('faq')
  }
  return tabs
})

async function loadLabels() {
  // Labels are now directly in ticket data, no separate file needed
  labelsReady.value = true
}

function setData(payload: UploadPayload) {
  tickets.value = payload.tickets ?? []
  meetups.value = payload.meetups ?? []
}

function reset() {
  tickets.value = []
  meetups.value = []
}

export function useDataStore() {
  return {
    tickets,
    meetups,
    labelsReady,
    hasTickets,
    hasMeetups,
    hasData,
    availableTabs,
    loadLabels,
    setData,
    reset,
  }
}
