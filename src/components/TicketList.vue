<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Ticket } from '../types/ticket'
import { groupByStatus, filterByDateRange } from '../utils/ticketFilters'
import { getCustomFieldString, getAssigneeAlias, getCfpStatus } from '../utils/ticketHelpers'
import type { CfpStatus } from '../utils/ticketHelpers'
import StatusGroup from './StatusGroup.vue'
import ActivityHeatmap from './ActivityHeatmap.vue'
import DateRangePicker from './DateRangePicker.vue'

const props = defineProps<{
  tickets: Ticket[]
  enabledFilters?: string[]
}>()

const selectedAssignees = ref<string[]>([])
const selectedOrganizers = ref<string[]>([])
const selectedEngagements = ref<string[]>([])
const selectedCfp = ref<CfpStatus[]>([])
const selectedCoSpeakers = ref<string[]>([])
const selectedDeus = ref<string[]>([])
const startDate = ref('')
const endDate = ref('')
const assigneeDropdownOpen = ref(false)
const organizerDropdownOpen = ref(false)
const engagementDropdownOpen = ref(false)
const cfpDropdownOpen = ref(false)
const coSpeakerDropdownOpen = ref(false)
const deuDropdownOpen = ref(false)
const assigneeFilterRef = ref<HTMLElement | null>(null)
const organizerFilterRef = ref<HTMLElement | null>(null)
const engagementFilterRef = ref<HTMLElement | null>(null)
const cfpFilterRef = ref<HTMLElement | null>(null)
const coSpeakerFilterRef = ref<HTMLElement | null>(null)
const deuFilterRef = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  if (assigneeFilterRef.value && !assigneeFilterRef.value.contains(e.target as Node)) {
    assigneeDropdownOpen.value = false
  }
  if (organizerFilterRef.value && !organizerFilterRef.value.contains(e.target as Node)) {
    organizerDropdownOpen.value = false
  }
  if (engagementFilterRef.value && !engagementFilterRef.value.contains(e.target as Node)) {
    engagementDropdownOpen.value = false
  }
  if (cfpFilterRef.value && !cfpFilterRef.value.contains(e.target as Node)) {
    cfpDropdownOpen.value = false
  }
  if (coSpeakerFilterRef.value && !coSpeakerFilterRef.value.contains(e.target as Node)) {
    coSpeakerDropdownOpen.value = false
  }
  if (deuFilterRef.value && !deuFilterRef.value.contains(e.target as Node)) {
    deuDropdownOpen.value = false
  }
}
function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    assigneeDropdownOpen.value = false
    organizerDropdownOpen.value = false
    engagementDropdownOpen.value = false
    cfpDropdownOpen.value = false
    coSpeakerDropdownOpen.value = false
    deuDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onEscape)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onEscape)
})

const CFP_OPTIONS: { value: CfpStatus; label: string }[] = [
  { value: 'submitted', label: 'CFP Submitted' },
  { value: 'accepted', label: 'CFP Accepted' },
  { value: 'none', label: 'No CFP' },
]

function toggleCfp(val: CfpStatus) {
  const idx = selectedCfp.value.indexOf(val)
  if (idx >= 0) selectedCfp.value.splice(idx, 1)
  else selectedCfp.value.push(val)
}
function clearCfp() { selectedCfp.value = [] }

const assignees = computed(() => {
  const set = new Set<string>()
  for (const t of props.tickets) {
    const alias = getAssigneeAlias(t)
    if (alias) set.add(alias)
  }
  return [...set].sort()
})

const organizers = computed(() => {
  const set = new Set<string>()
  for (const t of props.tickets) {
    const v = getCustomFieldString(t, 'activity_organizer')
    if (v) set.add(v)
  }
  return [...set].sort()
})

const engagementTypes = computed(() => {
  const set = new Set<string>()
  for (const t of props.tickets) {
    const v = getCustomFieldString(t, 'engagement_type')
    if (v) set.add(v)
  }
  return [...set].sort()
})

const allCoSpeakers = computed(() => {
  const set = new Set<string>()
  for (const t of props.tickets) {
    const v = getCustomFieldString(t, 'secondary_da_aliases')
    if (v) {
      v.split(',').map(s => s.trim()).filter(Boolean).forEach(a => set.add(a))
    }
  }
  return [...set].sort()
})

function toggleAssignee(val: string) {
  const idx = selectedAssignees.value.indexOf(val)
  if (idx >= 0) selectedAssignees.value.splice(idx, 1)
  else selectedAssignees.value.push(val)
}
function clearAssignees() { selectedAssignees.value = [] }

function toggleOrganizer(val: string) {
  const idx = selectedOrganizers.value.indexOf(val)
  if (idx >= 0) selectedOrganizers.value.splice(idx, 1)
  else selectedOrganizers.value.push(val)
}
function clearOrganizers() { selectedOrganizers.value = [] }

function toggleEngagement(val: string) {
  const idx = selectedEngagements.value.indexOf(val)
  if (idx >= 0) selectedEngagements.value.splice(idx, 1)
  else selectedEngagements.value.push(val)
}
function clearEngagements() { selectedEngagements.value = [] }

function toggleCoSpeaker(alias: string) {
  const idx = selectedCoSpeakers.value.indexOf(alias)
  if (idx >= 0) selectedCoSpeakers.value.splice(idx, 1)
  else selectedCoSpeakers.value.push(alias)
}
function clearCoSpeakers() { selectedCoSpeakers.value = [] }

const allDeus = computed(() => {
  const set = new Set<string>()
  for (const t of props.tickets) {
    for (const l of t.labels) {
      if (l.startsWith('DEU: ')) set.add(l.replace('DEU: ', ''))
    }
  }
  return [...set].sort()
})

function toggleDeu(val: string) {
  const idx = selectedDeus.value.indexOf(val)
  if (idx >= 0) selectedDeus.value.splice(idx, 1)
  else selectedDeus.value.push(val)
}
function clearDeus() { selectedDeus.value = [] }

const hasFilter = (name: string) => props.enabledFilters?.includes(name) ?? false

const displayedTickets = computed(() => {
  if (!props.enabledFilters?.length) return props.tickets
  let result = props.tickets.filter((t) => {
    if (hasFilter('assignee') && selectedAssignees.value.length > 0) {
      const alias = getAssigneeAlias(t)
      if (!selectedAssignees.value.includes(alias)) return false
    }
    if (hasFilter('organizer') && selectedOrganizers.value.length > 0) {
      const org = getCustomFieldString(t, 'activity_organizer')
      if (!selectedOrganizers.value.includes(org)) return false
    }
    if (hasFilter('engagement') && selectedEngagements.value.length > 0) {
      const eng = getCustomFieldString(t, 'engagement_type')
      if (!selectedEngagements.value.includes(eng)) return false
    }
    if (hasFilter('cfp') && selectedCfp.value.length > 0) {
      const status = getCfpStatus(t)
      if (!selectedCfp.value.includes(status)) return false
    }
    if (hasFilter('cospeaker') && selectedCoSpeakers.value.length > 0) {
      const aliases = getCustomFieldString(t, 'secondary_da_aliases')
        .split(',').map(s => s.trim()).filter(Boolean)
      if (!selectedCoSpeakers.value.some(a => aliases.includes(a))) return false
    }
    if (hasFilter('deu') && selectedDeus.value.length > 0) {
      const ticketDeus = t.labels.filter(l => l.startsWith('DEU: ')).map(l => l.replace('DEU: ', ''))
      if (!selectedDeus.value.some(d => ticketDeus.includes(d))) return false
    }
    return true
  })
  if (hasFilter('daterange') && (startDate.value || endDate.value)) {
    result = filterByDateRange(result, startDate.value || undefined, endDate.value || undefined)
  }
  return result
})

function onHeatmapDateSelect(date: string) {
  if (startDate.value === date && endDate.value === date) {
    startDate.value = ''
    endDate.value = ''
  } else {
    startDate.value = date
    endDate.value = date
  }
}

const groups = computed(() => groupByStatus(displayedTickets.value))
</script>

<template>
  <div class="ticket-list">
    <div v-if="enabledFilters?.length" class="filters">
      <div v-if="hasFilter('assignee')" ref="assigneeFilterRef" class="cospeaker-filter">
        <button class="filter-select cospeaker-toggle" @click="assigneeDropdownOpen = !assigneeDropdownOpen">
          {{ selectedAssignees.length ? `Assignee (${selectedAssignees.length})` : 'All assignees' }}
          <span class="chevron">▾</span>
        </button>
        <div v-if="assigneeDropdownOpen" class="cospeaker-dropdown">
          <label class="cospeaker-option" @click="clearAssignees()">
            <input type="checkbox" :checked="selectedAssignees.length === 0" :indeterminate="selectedAssignees.length > 0 && selectedAssignees.length < assignees.length" disabled />
            All assignees
          </label>
          <label v-for="a in assignees" :key="a" class="cospeaker-option" @click.prevent="toggleAssignee(a)">
            <input type="checkbox" :checked="selectedAssignees.includes(a)" />
            {{ a }}
          </label>
        </div>
      </div>
      <div v-if="hasFilter('organizer')" ref="organizerFilterRef" class="cospeaker-filter">
        <button class="filter-select cospeaker-toggle" @click="organizerDropdownOpen = !organizerDropdownOpen">
          {{ selectedOrganizers.length ? `Organizers (${selectedOrganizers.length})` : 'All organizers' }}
          <span class="chevron">▾</span>
        </button>
        <div v-if="organizerDropdownOpen" class="cospeaker-dropdown">
          <label class="cospeaker-option" @click="clearOrganizers()">
            <input type="checkbox" :checked="selectedOrganizers.length === 0" :indeterminate="selectedOrganizers.length > 0 && selectedOrganizers.length < organizers.length" disabled />
            All organizers
          </label>
          <label v-for="o in organizers" :key="o" class="cospeaker-option" @click.prevent="toggleOrganizer(o)">
            <input type="checkbox" :checked="selectedOrganizers.includes(o)" />
            {{ o }}
          </label>
        </div>
      </div>
      <div v-if="hasFilter('engagement')" ref="engagementFilterRef" class="cospeaker-filter">
        <button class="filter-select cospeaker-toggle" @click="engagementDropdownOpen = !engagementDropdownOpen">
          {{ selectedEngagements.length ? `Engagement (${selectedEngagements.length})` : 'All engagement types' }}
          <span class="chevron">▾</span>
        </button>
        <div v-if="engagementDropdownOpen" class="cospeaker-dropdown">
          <label class="cospeaker-option" @click="clearEngagements()">
            <input type="checkbox" :checked="selectedEngagements.length === 0" :indeterminate="selectedEngagements.length > 0 && selectedEngagements.length < engagementTypes.length" disabled />
            All engagement types
          </label>
          <label v-for="e in engagementTypes" :key="e" class="cospeaker-option" @click.prevent="toggleEngagement(e)">
            <input type="checkbox" :checked="selectedEngagements.includes(e)" />
            {{ e }}
          </label>
        </div>
      </div>
      <div v-if="hasFilter('cfp')" ref="cfpFilterRef" class="cospeaker-filter">
        <button class="filter-select cospeaker-toggle" @click="cfpDropdownOpen = !cfpDropdownOpen">
          {{ selectedCfp.length ? `CFP (${selectedCfp.length})` : 'CFP: Any' }}
          <span class="chevron">▾</span>
        </button>
        <div v-if="cfpDropdownOpen" class="cospeaker-dropdown">
          <label class="cospeaker-option" @click="clearCfp()">
            <input type="checkbox" :checked="selectedCfp.length === 0" :indeterminate="selectedCfp.length > 0 && selectedCfp.length < CFP_OPTIONS.length" disabled />
            Any
          </label>
          <label v-for="opt in CFP_OPTIONS" :key="opt.value" class="cospeaker-option" @click.prevent="toggleCfp(opt.value)">
            <input type="checkbox" :checked="selectedCfp.includes(opt.value)" />
            {{ opt.label }}
          </label>
        </div>
      </div>
      <div v-if="hasFilter('cospeaker')" ref="coSpeakerFilterRef" class="cospeaker-filter">
        <button class="filter-select cospeaker-toggle" @click="coSpeakerDropdownOpen = !coSpeakerDropdownOpen">
          {{ selectedCoSpeakers.length ? `Co-speakers (${selectedCoSpeakers.length})` : 'All co-speakers' }}
          <span class="chevron">▾</span>
        </button>
        <div v-if="coSpeakerDropdownOpen" class="cospeaker-dropdown">
          <label class="cospeaker-option" @click="clearCoSpeakers()">
            <input type="checkbox" :checked="selectedCoSpeakers.length === 0" :indeterminate="selectedCoSpeakers.length > 0 && selectedCoSpeakers.length < allCoSpeakers.length" disabled />
            All co-speakers
          </label>
          <label v-for="alias in allCoSpeakers" :key="alias" class="cospeaker-option" @click.prevent="toggleCoSpeaker(alias)">
            <input type="checkbox" :checked="selectedCoSpeakers.includes(alias)" />
            {{ alias }}
          </label>
        </div>
      </div>
      <div v-if="hasFilter('deu')" ref="deuFilterRef" class="cospeaker-filter">
        <button class="filter-select cospeaker-toggle" @click="deuDropdownOpen = !deuDropdownOpen">
          {{ selectedDeus.length ? `DEU (${selectedDeus.length})` : 'All DEUs' }}
          <span class="chevron">▾</span>
        </button>
        <div v-if="deuDropdownOpen" class="cospeaker-dropdown">
          <label class="cospeaker-option" @click="clearDeus()">
            <input type="checkbox" :checked="selectedDeus.length === 0" :indeterminate="selectedDeus.length > 0 && selectedDeus.length < allDeus.length" disabled />
            All DEUs
          </label>
          <label v-for="d in allDeus" :key="d" class="cospeaker-option" @click.prevent="toggleDeu(d)">
            <input type="checkbox" :checked="selectedDeus.includes(d)" />
            {{ d }}
          </label>
        </div>
      </div>
      <DateRangePicker
        v-if="hasFilter('daterange')"
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
      />
    </div>
    <ActivityHeatmap :tickets="displayedTickets" class="heatmap-section" @select-date="onHeatmapDateSelect" />
    <StatusGroup
      title="Backlog"
      :tickets="groups.assigned"
      :show-month-groups="true"
    />
    <StatusGroup
      title="Accepted"
      :tickets="groups.accepted"
      :show-month-groups="true"
    />
    <StatusGroup
      title="Resolved"
      :tickets="groups.resolved"
      :show-month-groups="true"
    />
  </div>
</template>

<style scoped>
.ticket-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.filters {
  grid-column: 1 / -1;
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

.cospeaker-filter {
  position: relative;
}

.cospeaker-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.chevron {
  font-size: 0.7rem;
}

.cospeaker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 20;
  min-width: 200px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.cospeaker-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 0.85rem;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.cospeaker-option:hover {
  background-color: #f1f5f9;
}

.cospeaker-option input[type="checkbox"] {
  pointer-events: none;
}

.heatmap-section {
  grid-column: 1 / -1;
}

/* Responsive grid: 1 column on mobile, 3 columns on desktop */
@media (min-width: 1024px) {
  .ticket-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .ticket-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
