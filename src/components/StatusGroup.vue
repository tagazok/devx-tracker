<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ticket } from '../types/ticket'
import { getCustomFieldNumber, sortByDate, groupByMonth } from '../utils/ticketHelpers'
import TicketCard from './TicketCard.vue'
import TicketViewerDialog from './TicketViewerDialog.vue'

const props = withDefaults(defineProps<{
  title: string
  tickets: Ticket[]
  showMonthGroups?: boolean
}>(), {
  showMonthGroups: false,
})

const sortOrder = ref<'asc' | 'desc'>('asc')

function toggleSort() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const sortedTickets = computed(() => sortByDate(props.tickets, sortOrder.value))

const monthGroups = computed(() =>
  props.showMonthGroups ? groupByMonth(sortedTickets.value) : []
)

const selectedTicket = ref<Ticket | null>(null)

const totalAttendees = computed(() => {
  let sum = 0
  for (const t of props.tickets) {
    const val = getCustomFieldNumber(t, 'actual_audience_size_reached')
    if (val !== null && val > 0) sum += val
  }
  return sum
})
</script>

<template>
  <section class="status-group">
    <h2 class="status-header">
      {{ title }} ({{ tickets.length }})
      <span v-if="totalAttendees > 0" class="header-attendees">— 👥 {{ totalAttendees }} attendees</span>
      <button
        class="sort-toggle"
        :title="sortOrder === 'asc' ? 'Oldest first — click for newest first' : 'Newest first — click for oldest first'"
        @click="toggleSort"
      >
        <span v-if="sortOrder === 'asc'">▲</span>
        <span v-else>▼</span>
      </button>
    </h2>
    <div class="status-tickets">
      <template v-if="showMonthGroups">
        <template v-for="group in monthGroups" :key="group.label">
          <div class="month-label">{{ group.label }}</div>
          <TicketCard
            v-for="ticket in group.tickets"
            :key="ticket.id"
            :ticket="ticket"
            @click="selectedTicket = ticket"
          />
        </template>
      </template>
      <template v-else>
        <TicketCard
          v-for="ticket in sortedTickets"
          :key="ticket.id"
          :ticket="ticket"
          @click="selectedTicket = ticket"
        />
      </template>
    </div>
    <TicketViewerDialog
      v-if="selectedTicket"
      :ticket="selectedTicket"
      @close="selectedTicket = null"
    />
  </section>
</template>

<style scoped>
.status-group {
  margin-bottom: 24px;
}

.status-header {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 480px) {
  .status-header {
    font-size: 1rem;
  }
}

.header-attendees {
  font-size: 0.85rem;
  font-weight: 400;
  color: #64748b;
}

@media (max-width: 480px) {
  .header-attendees {
    font-size: 0.75rem;
  }
}

.sort-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #64748b;
  font-size: 0.7rem;
  width: 22px;
  height: 22px;
  cursor: pointer;
  margin-left: auto;
  padding: 0;
  line-height: 1;
  transition: color 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.sort-toggle:hover {
  color: #334155;
  border-color: #94a3b8;
}

.status-tickets {
  display: flex;
  flex-direction: column;
}

.month-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 0 4px;
  margin-top: 4px;
}
</style>
