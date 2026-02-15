<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import type { RawMeetupGroup } from '../types/meetup'

const props = defineProps<{
  group: RawMeetupGroup
}>()

const emit = defineEmits<{
  close: []
}>()

const isDescriptionExpanded = ref(false)

const isDescriptionLong = computed(() => {
  return processedDescription.value.length > 500
})

const processedDescription = computed(() => {
  if (!props.group.description || !props.group.description.trim()) {
    return ''
  }
  
  let content = props.group.description.trim()
  
  // First, unescape any escaped HTML entities
  content = content
    .replace(/&lt;br&gt;/g, '<br>')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  
  // Check if content already has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content)
  
  if (hasHtmlTags) {
    // Content already has HTML, just return it
    return content
  }
  
  // Otherwise, process as markdown
  return convertMarkdownToHtml(content)
})

function convertMarkdownToHtml(text: string): string {
  let html = text
  
  // Convert markdown links [text](url) to HTML
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  
  // Convert bold **text** to HTML
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  
  // Convert italic *text* to HTML (but not inside bold)
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  
  // Convert inline code `code` to HTML
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // Convert headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  
  // Convert double line breaks to paragraph breaks
  const paragraphs = html.split(/\n\n+/)
  html = paragraphs
    .map(p => {
      p = p.trim()
      if (!p) return ''
      // Don't wrap if already has block-level tags
      if (p.match(/^<(h[1-6]|div|pre|blockquote)/)) {
        return p
      }
      // Replace single line breaks with <br>
      p = p.replace(/\n/g, '<br>')
      return `<p>${p}</p>`
    })
    .filter(Boolean)
    .join('')
  
  return html
}
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

function formatFoundedDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return ''
    }
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    return `${month} ${year}`
  } catch {
    return ''
  }
}

function getAllOrganizerEmails(): string {
  const emails = props.group.orgs.edges
    .map(edge => edge.node.email)
    .filter(email => email && email.trim())
  return `mailto:${emails.join(',')}`
}

function getValidSocialLinks() {
  return props.group.socialNetworks.filter(
    network => network.identifier && network.identifier.trim()
  )
}

function getMemberCount(): number {
  return props.group.groupAnalytics?.memberCount ?? props.group.memberships.totalCount
}

function getRsvpCount(): number {
  return props.group.pastEvents.edges.reduce((sum, edge) => sum + edge.node.rsvps.totalCount, 0)
}

function getEventsThisYear(): number {
  const currentYear = new Date().getFullYear()
  return props.group.pastEvents.edges.filter(edge => {
    const eventYear = new Date(edge.node.dateTime).getFullYear()
    return eventYear === currentYear
  }).length
}

function getPlannedEvents(): number {
  return props.group.upcomingEvents.edges.length
}

function getAverageRsvpPerEvent(): number {
  const totalEvents = props.group.pastEvents.edges.length
  if (totalEvents === 0) return 0
  const totalRsvps = getRsvpCount()
  return Math.round(totalRsvps / totalEvents)
}

function getAverageAge(): number | null {
  if (!props.group.groupAnalytics?.averageAge) return null
  return Math.round(props.group.groupAnalytics.averageAge)
}

function formatGenderRatio(): string {
  if (!props.group.groupAnalytics?.genderMembershipRatios) return ''
  
  const { maleRatio, femaleRatio, otherRatio, unknownRatio } = props.group.groupAnalytics.genderMembershipRatios
  
  // Convert ratios to percentages
  const malePercent = Math.round(maleRatio * 100)
  const femalePercent = Math.round(femaleRatio * 100)
  const otherPercent = Math.round(otherRatio * 100)
  const unknownPercent = Math.round(unknownRatio * 100)
  
  // Build the display string, only showing non-zero values
  const parts = []
  if (malePercent > 0) parts.push(`${malePercent}% Male`)
  if (femalePercent > 0) parts.push(`${femalePercent}% Female`)
  if (otherPercent > 0) parts.push(`${otherPercent}% Other`)
  if (unknownPercent > 0) parts.push(`${unknownPercent}% Unknown`)
  
  return parts.length > 0 ? parts.join(', ') : 'No data'
}

function hasGenderRatio(): boolean {
  return !!(props.group.groupAnalytics?.genderMembershipRatios)
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
    aria-labelledby="group-dialog-title"
    @click="onBackdropClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <h2 id="group-dialog-title" class="dialog-title">{{ group.name }}</h2>
          <div class="header-meta">
            <span class="location">📍 {{ group.city }}, {{ group.country }}</span>
            <span v-if="formatFoundedDate(group.foundedDate)" class="founded">📅 Founded {{ formatFoundedDate(group.foundedDate) }}</span>
            <span v-if="group.proNetwork" class="pro-badge">✨ Pro Network</span>
          </div>
        </div>
        <button class="close-button" aria-label="Close dialog" @click="emit('close')">✕</button>
      </div>
      
      <div class="dialog-body">
        <!-- Description - Full Width -->
        <div v-if="processedDescription" class="description-section">
          <div 
            class="description" 
            :class="{ 'description-collapsed': isDescriptionLong && !isDescriptionExpanded }"
            v-html="processedDescription"
          ></div>
          <button 
            v-if="isDescriptionLong"
            class="expand-button"
            @click="isDescriptionExpanded = !isDescriptionExpanded"
          >
            {{ isDescriptionExpanded ? '▲ Show less' : '▼ Show more' }}
          </button>
        </div>

        <!-- Two Column Layout -->
        <div class="content-grid">
          <!-- Left Column -->
          <div class="column-left">
            <!-- Analytics Section -->
            <section class="card analytics-card">
              <h3 class="card-title">📊 Group Analytics</h3>
              
              <div v-if="!group.groupAnalytics && group.pastEvents.edges.length === 0 && group.upcomingEvents.edges.length === 0" class="placeholder-text">
                Analytics data is not available for this group.
              </div>
              
              <div v-else class="analytics-grid">
                <div class="stat-box">
                  <div class="stat-value">{{ getMemberCount() }}</div>
                  <div class="stat-label">Members</div>
                </div>
                
                <div class="stat-box">
                  <div class="stat-value">{{ getRsvpCount() }}</div>
                  <div class="stat-label">Total RSVPs</div>
                </div>
                
                <div class="stat-box">
                  <div class="stat-value">{{ getEventsThisYear() }}</div>
                  <div class="stat-label">Events This Year</div>
                </div>
                
                <div class="stat-box">
                  <div class="stat-value">{{ getPlannedEvents() }}</div>
                  <div class="stat-label">Upcoming Events</div>
                </div>
                
                <div v-if="getAverageAge()" class="stat-box">
                  <div class="stat-value">{{ getAverageAge() }}</div>
                  <div class="stat-label">Average Age</div>
                </div>
                
                <div class="stat-box">
                  <div class="stat-value">{{ getAverageRsvpPerEvent() }}</div>
                  <div class="stat-label">Avg RSVP/Event</div>
                </div>
                
                <div v-if="hasGenderRatio()" class="stat-box stat-box-wide">
                  <div class="stat-value-text">{{ formatGenderRatio() }}</div>
                  <div class="stat-label">Gender Distribution</div>
                </div>
              </div>
            </section>

            <!-- Social Media Section -->
            <section class="card social-card">
              <h3 class="card-title">🔗 Social Media</h3>
              
              <div v-if="getValidSocialLinks().length === 0" class="placeholder-text">
                No social media links available.
              </div>
              
              <div v-else class="social-links">
                <a 
                  v-for="network in getValidSocialLinks()" 
                  :key="network.service"
                  :href="network.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="social-link"
                >
                  <span class="social-icon">🌐</span>
                  <div class="social-info">
                    <div class="social-service">{{ network.service }}</div>
                    <div class="social-url">{{ network.url }}</div>
                  </div>
                </a>
              </div>
            </section>
          </div>

          <!-- Right Column -->
          <div class="column-right">
            <!-- Organizers Section -->
            <section class="card organizers-card">
              <h3 class="card-title">👥 Organizers</h3>
              
              <div v-if="group.orgs.edges.length === 0" class="placeholder-text">
                No organizers listed for this group.
              </div>
              
              <div v-else>
                <div class="organizers-list">
                  <div v-for="edge in group.orgs.edges" :key="edge.node.email || edge.node.name" class="organizer-card">
                    <img 
                      :src="edge.node.memberPhoto?.standardUrl || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Ccircle cx=%2232%22 cy=%2232%22 r=%2232%22 fill=%22%23e2e8f0%22/%3E%3Cpath d=%22M32 32c5.9 0 10.7-4.8 10.7-10.7S37.9 10.7 32 10.7 21.3 15.5 21.3 21.3 26.1 32 32 32zm0 5.3c-7.1 0-21.3 3.6-21.3 10.7v5.3h42.7v-5.3c0-7.1-14.2-10.7-21.3-10.7z%22 fill=%22%2394a3b8%22/%3E%3C/svg%3E'"
                      :alt="edge.node.name"
                      class="organizer-photo"
                    />
                    <div class="organizer-info">
                      <div class="organizer-name">
                        <a 
                          v-if="edge.node.memberUrl && edge.node.memberUrl.trim()"
                          :href="edge.node.memberUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="organizer-link"
                        >
                          {{ edge.node.name }}
                        </a>
                        <span v-else>{{ edge.node.name }}</span>
                      </div>
                      <a 
                        v-if="edge.node.email && edge.node.email.trim()"
                        :href="`mailto:${edge.node.email}`"
                        class="organizer-email"
                      >
                        {{ edge.node.email }}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div v-if="group.orgs.edges.length > 1" class="email-all-container">
                  <a :href="getAllOrganizerEmails()" class="email-all-button">
                    📧 Email All Organizers
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dialog Overlay and Container */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.dialog-container {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Header Section */
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
  gap: 20px;
}

.header-content {
  flex: 1;
  min-width: 0;
}

.dialog-title {
  margin: 0 0 12px 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  line-height: 1.3;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  font-size: 0.875rem;
  opacity: 0.95;
}

.location,
.founded {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pro-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  line-height: 1;
  flex-shrink: 0;
  transition: all 0.2s;
  font-weight: 300;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.close-button:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Scrollable Body */
.dialog-body {
  overflow-y: auto;
  padding: 32px;
  flex: 1;
  background: #f8fafc;
}

/* Description Section */
.description-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.description {
  color: #475569;
  line-height: 1.7;
  margin: 0;
  font-size: 0.95rem;
  transition: max-height 0.3s ease;
  overflow: hidden;
  position: relative;
}

.description-collapsed {
  max-height: 10.5em; /* Approximately 7-8 lines at 1.7 line-height */
}

.description-collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3em;
  background: linear-gradient(to bottom, transparent, white);
  pointer-events: none;
}

.expand-button {
  display: block;
  margin: 12px auto 0;
  padding: 8px 16px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-button:hover {
  background: #e2e8f0;
  border-color: #cbd5e1;
  color: #764ba2;
}

.expand-button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* HTML content styling */
.description :deep(p) {
  margin: 0 0 12px 0;
}

.description :deep(p:last-child) {
  margin-bottom: 0;
}

.description :deep(h1),
.description :deep(h2),
.description :deep(h3),
.description :deep(h4),
.description :deep(h5),
.description :deep(h6) {
  color: #1e293b;
  font-weight: 700;
  margin: 16px 0 12px 0;
}

.description :deep(h1) {
  font-size: 1.5rem;
}

.description :deep(h2) {
  font-size: 1.25rem;
}

.description :deep(h3) {
  font-size: 1.1rem;
}

.description :deep(strong),
.description :deep(b) {
  font-weight: 700;
  color: #1e293b;
}

.description :deep(em),
.description :deep(i) {
  font-style: italic;
}

.description :deep(a) {
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s;
  word-break: break-word;
}

.description :deep(a:hover) {
  color: #764ba2;
  text-decoration: underline;
}

.description :deep(ul),
.description :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.description :deep(li) {
  margin: 4px 0;
}

.description :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875em;
  color: #e11d48;
}

.description :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.description :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  font-size: 0.875rem;
}

.description :deep(br) {
  display: block;
  content: "";
  margin-top: 4px;
}

.description :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 16px;
  margin: 12px 0;
  color: #64748b;
  font-style: italic;
}

/* Two Column Grid Layout */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

@media (min-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

.column-left,
.column-right {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Card Styling */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-title {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

/* Placeholder Text */
.placeholder-text {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 32px 16px;
  font-size: 0.9rem;
}

/* Analytics Section */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-box {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.stat-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.stat-box-wide {
  grid-column: 1 / -1;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 800;
  color: #667eea;
  line-height: 1;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-value-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.5;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.05em;
}

/* Organizers Section */
.organizers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.organizer-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s;
}

.organizer-card:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
  transform: translateX(4px);
}

.organizer-photo {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.organizer-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.organizer-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.organizer-link {
  color: #667eea;
  text-decoration: none;
  transition: color 0.2s;
}

.organizer-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

.organizer-link:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  border-radius: 2px;
}

.organizer-email {
  font-size: 0.85rem;
  color: #64748b;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s;
}

.organizer-email:hover {
  color: #667eea;
  text-decoration: underline;
}

.organizer-email:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  border-radius: 2px;
}

.email-all-container {
  margin-top: 8px;
  text-align: center;
}

.email-all-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.email-all-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.email-all-button:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Social Media Links */
.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s;
}

.social-link:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #cbd5e1;
  transform: translateX(4px);
}

.social-link:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.social-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  line-height: 1;
}

.social-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.social-service {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1e293b;
}

.social-url {
  font-size: 0.8rem;
  color: #667eea;
  word-break: break-all;
}

/* Responsive Design - Mobile */
@media (max-width: 767px) {
  .dialog-overlay {
    padding: 10px;
  }

  .dialog-container {
    max-height: 95vh;
    border-radius: 12px;
  }

  .dialog-header {
    padding: 20px;
  }

  .dialog-title {
    font-size: 1.35rem;
  }

  .header-meta {
    font-size: 0.8rem;
    gap: 12px;
  }

  .dialog-body {
    padding: 20px;
  }

  .content-grid {
    gap: 20px;
  }

  .card {
    padding: 20px;
  }

  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 2rem;
  }

  .organizer-photo {
    width: 56px;
    height: 56px;
  }
}

/* Tablet Optimization */
@media (min-width: 768px) and (max-width: 1023px) {
  .dialog-container {
    max-width: 900px;
  }

  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large Desktop Optimization */
@media (min-width: 1024px) {
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Accessibility - High Contrast Support */
@media (prefers-contrast: high) {
  .dialog-container {
    border: 3px solid #1e293b;
  }

  .card,
  .organizer-card,
  .social-link,
  .stat-box {
    border-width: 2px;
  }
}

/* Accessibility - Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .close-button,
  .organizer-card,
  .social-link,
  .stat-box,
  .email-all-button,
  .card {
    transition: none;
  }

  .close-button:hover,
  .organizer-card:hover,
  .social-link:hover,
  .stat-box:hover,
  .email-all-button:hover {
    transform: none;
  }
}

/* Focus Styles for Keyboard Navigation */
*:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
</style>
