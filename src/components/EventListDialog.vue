<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { RawMeetupEvent } from '../types/meetup'
import { categorizeEvents } from '../utils/eventListHelpers'

const props = defineProps<{
  groupName: string
  events: RawMeetupEvent[]
}>()

const emit = defineEmits<{
  close: []
}>()

const categorized = computed(() => categorizeEvents(props.events, new Date()))

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('dialog-overlay')) {
    emit('close')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div
    class="dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="event-dialog-title"
    @click="onBackdropClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 id="event-dialog-title" class="dialog-title">{{ groupName }}</h2>
        <button class="close-button" aria-label="Close dialog" @click="emit('close')">✕</button>
      </div>
      <div class="dialog-body">
        <template v-if="categorized.upcoming.length === 0 && categorized.past.length === 0">
          <p class="no-events">No events for this year</p>
        </template>

        <template v-if="categorized.upcoming.length > 0">
          <h3 class="section-header">Upcoming</h3>
          <div class="event-card" v-for="event in categorized.upcoming" :key="event.id">
            <span class="event-icon" aria-hidden="true">📅</span>
            <div class="event-details">
              <h4 class="event-title">{{ event.title }}</h4>
              <p class="event-description">{{ event.descriptionPreview }}</p>
              <div class="event-meta">
                <time :datetime="event.dateTime" class="event-date">{{ event.dateFormatted }}</time>
                <span class="event-rsvp">👥 {{ event.rsvpCount }} RSVPs</span>
                <a v-if="event.eventUrl" :href="event.eventUrl" target="_blank" rel="noopener noreferrer" class="event-link">View event ↗</a>
              </div>
            </div>
          </div>
        </template>

        <template v-if="categorized.past.length > 0">
          <h3 class="section-header">Past</h3>
          <div class="event-card" v-for="event in categorized.past" :key="event.id">
            <span class="event-icon" aria-hidden="true">📅</span>
            <div class="event-details">
              <h4 class="event-title">{{ event.title }}</h4>
              <p class="event-description">{{ event.descriptionPreview }}</p>
              <div class="event-meta">
                <time :datetime="event.dateTime" class="event-date">{{ event.dateFormatted }}</time>
                <span class="event-rsvp">👥 {{ event.rsvpCount }} RSVPs</span>
                <a v-if="event.eventUrl" :href="event.eventUrl" target="_blank" rel="noopener noreferrer" class="event-link">View event ↗</a>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog-container {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #64748b;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1;
}

.close-button:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dialog-body {
  overflow-y: auto;
  padding: 16px;
  flex: 1;
}

.no-events {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  margin: 24px 0;
}

.section-header {
  font-size: 0.85rem;
  font-weight: 600;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
}

.section-header + .section-header {
  margin-top: 16px;
}

.event-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.event-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  line-height: 1;
}

.event-details {
  min-width: 0;
  flex: 1;
}

.event-title {
  margin: 0 0 4px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.event-description {
  margin: 0 0 6px 0;
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.4;
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
  color: #64748b;
}

.event-date {
  color: #1e293b;
  font-weight: 500;
}

.event-rsvp {
  color: #64748b;
}

.event-link {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.8rem;
  white-space: nowrap;
}

.event-link:hover {
  text-decoration: underline;
}

/* Add spacing between last card of upcoming and past section header */
.event-card:last-of-type + .section-header {
  margin-top: 16px;
}
</style>
