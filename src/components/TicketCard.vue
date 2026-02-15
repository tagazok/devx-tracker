<script setup lang="ts">
import { computed } from 'vue'
import type { Ticket } from '../types/ticket'
import { getCustomFieldString, getCustomFieldDate, getSimLink, getCustomFieldNumber, getAssigneeAlias } from '../utils/ticketHelpers'

const props = defineProps<{
  ticket: Ticket
}>()

const emit = defineEmits<{
  click: []
}>()

const city = getCustomFieldString(props.ticket, 'city')
const country = getCustomFieldString(props.ticket, 'country')
const engagementType = getCustomFieldString(props.ticket, 'engagement_type')
const date = getCustomFieldDate(props.ticket, 'date')
const publicContentUrl = getCustomFieldString(
  props.ticket,
  'url_to_public_content_associated_with_this_activity_such_as_speakerdeck_link'
)
const simLink = getSimLink(props.ticket)
const assigneeAlias = getAssigneeAlias(props.ticket)
const audienceSize = getCustomFieldNumber(props.ticket, 'actual_audience_size_reached')
const secondaryAliases = getCustomFieldString(props.ticket, 'secondary_da_aliases')
const coSpeakers = secondaryAliases ? secondaryAliases.split(',').map(s => s.trim()).filter(Boolean) : []

const avatarExtensions: Record<string, string> = {
  achb: 'jpeg', arnajean: 'jpeg', guimathe: 'jpeg', jrwood: 'jpeg',
  maishsk: 'png', msalihg: 'jpeg', oleplus: 'jpeg', souterre: 'jpeg',
  stonesna: 'png', stormacq: 'jpeg', vby: 'jpeg',
}
function getAvatarUrl(alias: string): string | null {
  const ext = avatarExtensions[alias.toLowerCase()]
  return ext ? `${import.meta.env.BASE_URL}team-avatars/${alias.toLowerCase()}.${ext}` : null
}

const formattedDate = date
  ? new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  : ''

const tagColorClass = computed(() => {
  if (!engagementType) return ''
  if (engagementType.toLowerCase().includes('workshop')) return 'tag-workshop'
  if (engagementType.toLowerCase().includes('online')) return 'tag-online'
  if (engagementType.toLowerCase().includes('in-person')) return 'tag-in-person'
  return 'tag-default'
})
</script>

<template>
  <div class="ticket-card" @click="emit('click')">
    <a v-if="assigneeAlias" class="ticket-assignee" :href="`https://phonetool.amazon.com/users/${assigneeAlias}`" target="_blank" rel="noopener noreferrer" :data-tooltip="assigneeAlias" @click.stop>
      <img v-if="getAvatarUrl(assigneeAlias)" :src="getAvatarUrl(assigneeAlias)!" :alt="assigneeAlias" class="assignee-avatar" />
      <span v-else class="assignee-initials">{{ assigneeAlias.slice(0, 2).toUpperCase() }}</span>
    </a>
    <h3 class="ticket-title">{{ ticket.title }}</h3>

    <div class="ticket-details">
      <span v-if="city || country" class="ticket-location">
        {{ [city, country].filter(Boolean).join(', ') }}
      </span>
      <span v-if="formattedDate" class="ticket-date">{{ formattedDate }}</span>
    </div>

    <div v-if="audienceSize !== null" class="ticket-audience">👥 {{ audienceSize }} attendees</div>

    <div v-if="coSpeakers.length" class="ticket-cospeakers">
      🎤 with: <a v-for="(name, i) in coSpeakers" :key="i" class="cospeaker-pill" :href="`https://phonetool.amazon.com/users/${name}`" target="_blank" rel="noopener noreferrer" @click.stop>
        <img v-if="getAvatarUrl(name)" :src="getAvatarUrl(name)!" :alt="name" class="cospeaker-avatar" />
        {{ name }}
      </a>
    </div>

    <span v-if="engagementType" :class="['engagement-tag', tagColorClass]">{{ engagementType }}</span>

    <div class="ticket-links">
      <a
        v-if="publicContentUrl"
        :href="publicContentUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="ticket-link"
        @click.stop
      >
        Content link
      </a>
      <a
        v-if="simLink"
        :href="simLink"
        target="_blank"
        rel="noopener noreferrer"
        class="ticket-link"
        @click.stop
      >
        SIM Link
      </a>
    </div>
  </div>
</template>

<style scoped>
.ticket-card {
  position: relative;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.ticket-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px 0;
  padding-right: 40px;
}

.ticket-details {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 10px;
}

.ticket-location::before {
  content: '📍 ';
}

.ticket-assignee {
  position: absolute;
  top: 12px;
  right: 12px;
  text-decoration: none;
}

.ticket-assignee::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  background: #1e293b;
  color: #fff;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.ticket-assignee:hover::after {
  opacity: 1;
}

.ticket-assignee:hover {
  opacity: 1;
}

.assignee-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.assignee-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 600;
}

.ticket-date::before {
  content: '📅 ';
}

.ticket-audience {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 10px;
}

.ticket-cospeakers {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.cospeaker-pill {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background-color: #f1f5f9;
  color: #334155;
  font-size: 0.75rem;
  padding: 2px 8px 2px 2px;
  border-radius: 9999px;
  overflow: hidden;
  text-decoration: none;
  cursor: pointer;
}

.cospeaker-pill:hover {
  background-color: #e2e8f0;
}

.cospeaker-pill:not(:has(.cospeaker-avatar)) {
  padding-left: 8px;
}

.cospeaker-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 4px;
}

.engagement-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 9999px;
  white-space: nowrap;
  margin-bottom: 10px;
}

.tag-in-person {
  background-color: #dbeafe;
  color: #1e40af;
}

.tag-workshop {
  background-color: #fef3c7;
  color: #92400e;
}

.tag-online {
  background-color: #d1fae5;
  color: #065f46;
}

.tag-default {
  background-color: #f1f5f9;
  color: #475569;
}

.ticket-links {
  display: flex;
  gap: 12px;
}

.ticket-link {
  font-size: 0.85rem;
  color: #2563eb;
  text-decoration: none;
}

.ticket-link:hover {
  text-decoration: underline;
}
</style>
