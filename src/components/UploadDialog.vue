<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { validateFileSelections } from '../utils/uploadValidation'
import { readJsonFile } from '../utils/fileParser'
import type { UploadPayload } from '../composables/useDataStore'
import type { Ticket } from '../types/ticket'
import type { RawMeetupGroup } from '../types/meetup'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'upload', payload: UploadPayload): void
}>()

const ticketsFile = ref<File | null>(null)
const meetupsFile = ref<File | null>(null)
const errorMessage = ref<string | null>(null)
const loading = ref(false)

const validation = computed(() =>
  validateFileSelections({
    ticketsFile: ticketsFile.value,
    meetupsFile: meetupsFile.value,
  })
)

const goDisabled = computed(() => !validation.value.valid || loading.value)

watch(
  [ticketsFile, meetupsFile],
  () => {
    errorMessage.value = validation.value.error
  }
)

function onFileChange(field: 'tickets' | 'meetups', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (field === 'tickets') ticketsFile.value = file
  else meetupsFile.value = file
}

function resetState() {
  ticketsFile.value = null
  meetupsFile.value = null
  errorMessage.value = null
  loading.value = false
}

function handleClose() {
  resetState()
  emit('close')
}

function onBackdropClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('dialog-overlay')) {
    handleClose()
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

async function handleGo() {
  loading.value = true
  errorMessage.value = null

  try {
    const payload: UploadPayload = {}

    if (ticketsFile.value) {
      payload.tickets = await readJsonFile<Ticket[]>(ticketsFile.value)
    }
    if (meetupsFile.value) {
      payload.meetups = await readJsonFile<RawMeetupGroup[]>(meetupsFile.value)
    }

    resetState()
    emit('upload', payload)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    v-if="open"
    class="dialog-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="upload-dialog-title"
    @click="onBackdropClick"
  >
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 id="upload-dialog-title" class="dialog-title">Load Data</h2>
        <button class="close-button" aria-label="Close dialog" @click="handleClose">✕</button>
      </div>

      <div class="dialog-body">
        <div class="file-field">
          <label class="file-label" for="tickets-input">Tickets (.json)</label>
          <input
            id="tickets-input"
            type="file"
            accept=".json"
            @change="onFileChange('tickets', $event)"
          />
        </div>

        <div class="file-field">
          <label class="file-label" for="meetups-input">Meetups (.json)</label>
          <input
            id="meetups-input"
            type="file"
            accept=".json"
            @change="onFileChange('meetups', $event)"
          />
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
      </div>

      <div class="dialog-footer">
        <button
          class="go-button"
          :disabled="goDisabled"
          @click="handleGo"
        >
          {{ loading ? 'Loading…' : 'Go' }}
        </button>
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
  max-width: 440px;
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
}

.dialog-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
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
  padding: 16px;
}

.file-field {
  margin-bottom: 14px;
}

.file-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.file-field input[type="file"] {
  width: 100%;
  font-size: 0.85rem;
}

.error-message {
  margin: 8px 0 0;
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
  font-size: 0.85rem;
}

.dialog-footer {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.go-button {
  padding: 8px 24px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.go-button:hover:not(:disabled) {
  background: #2563eb;
}

.go-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
