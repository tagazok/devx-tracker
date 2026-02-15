<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import type { Ticket } from '../types/ticket'
import { getCfpStatus, isNonEmptyUrl, getAssigneeAlias, getCustomFieldString, getCustomFieldDate, getSimLink } from '../utils/ticketHelpers'
import { renderMarkdown } from '../utils/markdownRenderer'

const props = defineProps<{
  ticket: Ticket
}>()

const emit = defineEmits<{
  close: []
}>()

const cfpStatus = computed(() => getCfpStatus(props.ticket))

const cfpLabel = computed(() => {
  if (cfpStatus.value === 'accepted') return 'CFP Accepted'
  if (cfpStatus.value === 'submitted') return 'CFP Submitted'
  return 'No CFP'
})

const cfpColor = computed(() => {
  if (cfpStatus.value === 'accepted') return '#22c55e'
  if (cfpStatus.value === 'submitted') return '#eab308'
  return '#6b7280'
})

const descriptionHtml = computed(() => {
  if (props.ticket.descriptionContentType === 'text/amz-markdown-sim') {
    return renderMarkdown(props.ticket.description)
  }
  return null
})

const assignee = computed(() => getAssigneeAlias(props.ticket))

const coSpeakers = computed(() => {
  const val = getCustomFieldString(props.ticket, 'secondary_da_aliases')
  return val ? val : ''
})

const ticketDate = computed(() => {
  const val = getCustomFieldDate(props.ticket, 'date')
  if (!val) return ''
  const d = new Date(val)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
})

const city = computed(() => getCustomFieldString(props.ticket, 'city'))
const country = computed(() => getCustomFieldString(props.ticket, 'country'))
const location = computed(() => {
  const parts = [city.value, country.value].filter(Boolean)
  return parts.join(', ')
})

const organizer = computed(() => getCustomFieldString(props.ticket, 'activity_organizer'))
const engagementType = computed(() => getCustomFieldString(props.ticket, 'engagement_type'))

const simLink = computed(() => getSimLink(props.ticket))
const contentUrl = computed(() => getCustomFieldString(props.ticket, 'url_to_public_content_associated_with_this_activity_such_as_speakerdeck_link'))
const internalUrl = computed(() => getCustomFieldString(props.ticket, 'url_to_internal_content_associated_on_workdocs_or_similiar'))

const resolvedLabels = computed(() => props.ticket.labels)

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
    aria-labelledby="ticket-dialog-title"
    @click="onBackdropClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 id="ticket-dialog-title" class="dialog-title">{{ ticket.title }}</h2>
        <button class="close-button" aria-label="Close dialog" @click="emit('close')">✕</button>
      </div>
      <div class="dialog-body">
        <!-- CFP Badge -->
        <div class="cfp-badge" :style="{ backgroundColor: cfpColor }">{{ cfpLabel }}</div>

        <!-- Description -->
        <div class="section" v-if="ticket.description">
          <h3 class="section-label">Description</h3>
          <div v-if="descriptionHtml" class="description-markdown" v-html="descriptionHtml"></div>
          <p v-else class="description-plain">{{ ticket.description }}</p>
        </div>

        <!-- Details grid -->
        <div class="details-grid">
          <div class="detail-item" v-if="assignee">
            <span class="detail-label">Assignee</span>
            <span class="detail-value">{{ assignee }}</span>
          </div>
          <div class="detail-item" v-if="coSpeakers">
            <span class="detail-label">Co-speakers</span>
            <span class="detail-value">{{ coSpeakers }}</span>
          </div>
          <div class="detail-item" v-if="ticketDate">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{ ticketDate }}</span>
          </div>
          <div class="detail-item" v-if="location">
            <span class="detail-label">Location</span>
            <span class="detail-value">{{ location }}</span>
          </div>
          <div class="detail-item" v-if="organizer">
            <span class="detail-label">Organizer</span>
            <span class="detail-value">{{ organizer }}</span>
          </div>
          <div class="detail-item" v-if="engagementType">
            <span class="detail-label">Engagement Type</span>
            <span class="detail-value">{{ engagementType }}</span>
          </div>
        </div>

        <!-- Links -->
        <div class="section" v-if="simLink || isNonEmptyUrl(contentUrl) || isNonEmptyUrl(internalUrl)">
          <h3 class="section-label">Links</h3>
          <div class="links-list">
            <a v-if="simLink" :href="simLink" target="_blank" rel="noopener noreferrer" class="link-item">SIM Ticket ↗</a>
            <a v-if="isNonEmptyUrl(contentUrl)" :href="contentUrl" target="_blank" rel="noopener noreferrer" class="link-item">Content URL ↗</a>
            <a v-if="isNonEmptyUrl(internalUrl)" :href="internalUrl" target="_blank" rel="noopener noreferrer" class="link-item">Internal Content ↗</a>
          </div>
        </div>

        <!-- Labels -->
        <div class="section" v-if="resolvedLabels.length > 0">
          <h3 class="section-label">Labels</h3>
          <div class="labels-list">
            <span class="label-pill" v-for="label in resolvedLabels" :key="label">{{ label }}</span>
          </div>
        </div>
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
  max-width: 640px;
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
  flex-shrink: 0;
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

.cfp-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 16px;
}

.section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 6px 0;
}

.description-markdown {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
}

.description-markdown :deep(h1),
.description-markdown :deep(h2),
.description-markdown :deep(h3) {
  margin: 12px 0 6px 0;
  color: #1e293b;
}

.description-markdown :deep(p) {
  margin: 0 0 8px 0;
}

.description-markdown :deep(pre) {
  background: #f1f5f9;
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.85rem;
}

.description-markdown :deep(code) {
  background: #f1f5f9;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.85em;
}

.description-markdown :deep(a) {
  color: #3b82f6;
  text-decoration: none;
}

.description-markdown :deep(a:hover) {
  text-decoration: underline;
}

.description-plain {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.9rem;
  color: #1e293b;
}

.links-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.link-item {
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.85rem;
  padding: 4px 10px;
  background: #eff6ff;
  border-radius: 6px;
}

.link-item:hover {
  text-decoration: underline;
  background: #dbeafe;
}

.labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label-pill {
  display: inline-block;
  padding: 3px 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.78rem;
  color: #475569;
}
</style>
