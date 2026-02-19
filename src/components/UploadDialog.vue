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

const ticketsDragOver = ref(false)
const meetupsDragOver = ref(false)

const ticketsInputRef = ref<HTMLInputElement | null>(null)
const meetupsInputRef = ref<HTMLInputElement | null>(null)

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

function isJsonFile(file: File): boolean {
  return file.name.endsWith('.json') || file.type === 'application/json'
}

function handleDrop(field: 'tickets' | 'meetups', event: DragEvent) {
  event.preventDefault()
  ticketsDragOver.value = false
  meetupsDragOver.value = false

  const file = event.dataTransfer?.files?.[0] ?? null
  if (file && !isJsonFile(file)) {
    errorMessage.value = 'Please drop a .json file'
    return
  }
  if (field === 'tickets') ticketsFile.value = file
  else meetupsFile.value = file
}

function handleDragOver(field: 'tickets' | 'meetups', event: DragEvent) {
  event.preventDefault()
  if (field === 'tickets') ticketsDragOver.value = true
  else meetupsDragOver.value = true
}

function handleDragLeave(field: 'tickets' | 'meetups') {
  if (field === 'tickets') ticketsDragOver.value = false
  else meetupsDragOver.value = false
}

function onFileChange(field: 'tickets' | 'meetups', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  if (field === 'tickets') ticketsFile.value = file
  else meetupsFile.value = file
}

function openFilePicker(field: 'tickets' | 'meetups') {
  if (field === 'tickets') ticketsInputRef.value?.click()
  else meetupsInputRef.value?.click()
}

function removeFile(field: 'tickets' | 'meetups') {
  if (field === 'tickets') {
    ticketsFile.value = null
    if (ticketsInputRef.value) ticketsInputRef.value.value = ''
  } else {
    meetupsFile.value = null
    if (meetupsInputRef.value) meetupsInputRef.value.value = ''
  }
}

function resetState() {
  ticketsFile.value = null
  meetupsFile.value = null
  errorMessage.value = null
  loading.value = false
  ticketsDragOver.value = false
  meetupsDragOver.value = false
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>

<template>
  <Transition name="overlay">
    <div
      v-if="open"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
      @click="onBackdropClick"
    >
      <Transition name="dialog" appear>
        <div class="dialog-container">
            <!-- Header -->
            <div class="dialog-header">
              <div class="header-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <h2 id="upload-dialog-title" class="dialog-title">Load Data</h2>
                <p class="dialog-subtitle">Import your tickets and meetups JSON files</p>
              </div>
              <button class="close-button" aria-label="Close dialog" @click="handleClose">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="dialog-body">
              <!-- Tickets drop zone -->
              <div class="drop-zone-wrapper">
                <label class="file-label">
                  <span class="label-icon">🎫</span> Tickets
                  <span class="label-hint">.json</span>
                </label>
                <div
                  :class="['drop-zone', { 'drag-over': ticketsDragOver, 'has-file': ticketsFile }]"
                  @drop="handleDrop('tickets', $event)"
                  @dragover="handleDragOver('tickets', $event)"
                  @dragleave="handleDragLeave('tickets')"
                  @click="!ticketsFile && openFilePicker('tickets')"
                  role="button"
                  tabindex="0"
                  :aria-label="ticketsFile ? 'Tickets file selected: ' + ticketsFile.name : 'Click or drag to select tickets file'"
                  @keydown.enter="!ticketsFile && openFilePicker('tickets')"
                  @keydown.space.prevent="!ticketsFile && openFilePicker('tickets')"
                >
                  <input
                    id="tickets-input"
                    ref="ticketsInputRef"
                    type="file"
                    accept=".json"
                    class="hidden-input"
                    @change="onFileChange('tickets', $event)"
                  />

                  <!-- Empty state -->
                  <div v-if="!ticketsFile" class="drop-zone-empty">
                    <div class="drop-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p class="drop-text">Drop file here or <span class="browse-link">browse</span></p>
                  </div>

                  <!-- File selected state -->
                  <div v-else class="drop-zone-file">
                    <div class="file-info">
                      <div class="file-icon-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div class="file-details">
                        <span class="file-name">{{ ticketsFile.name }}</span>
                        <span class="file-size">{{ formatFileSize(ticketsFile.size) }}</span>
                      </div>
                    </div>
                    <button class="remove-btn" aria-label="Remove tickets file" @click.stop="removeFile('tickets')">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Meetups drop zone -->
              <div class="drop-zone-wrapper">
                <label class="file-label">
                  <span class="label-icon">👥</span> Meetups
                  <span class="label-hint">.json</span>
                </label>
                <div
                  :class="['drop-zone', { 'drag-over': meetupsDragOver, 'has-file': meetupsFile }]"
                  @drop="handleDrop('meetups', $event)"
                  @dragover="handleDragOver('meetups', $event)"
                  @dragleave="handleDragLeave('meetups')"
                  @click="!meetupsFile && openFilePicker('meetups')"
                  role="button"
                  tabindex="0"
                  :aria-label="meetupsFile ? 'Meetups file selected: ' + meetupsFile.name : 'Click or drag to select meetups file'"
                  @keydown.enter="!meetupsFile && openFilePicker('meetups')"
                  @keydown.space.prevent="!meetupsFile && openFilePicker('meetups')"
                >
                  <input
                    id="meetups-input"
                    ref="meetupsInputRef"
                    type="file"
                    accept=".json"
                    class="hidden-input"
                    @change="onFileChange('meetups', $event)"
                  />

                  <div v-if="!meetupsFile" class="drop-zone-empty">
                    <div class="drop-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                    <p class="drop-text">Drop file here or <span class="browse-link">browse</span></p>
                  </div>

                  <div v-else class="drop-zone-file">
                    <div class="file-info">
                      <div class="file-icon-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div class="file-details">
                        <span class="file-name">{{ meetupsFile.name }}</span>
                        <span class="file-size">{{ formatFileSize(meetupsFile.size) }}</span>
                      </div>
                    </div>
                    <button class="remove-btn" aria-label="Remove meetups file" @click.stop="removeFile('meetups')">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Error message -->
              <Transition name="error">
                <p v-if="errorMessage" class="error-message" role="alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {{ errorMessage }}
                </p>
              </Transition>
            </div>

            <!-- Footer -->
            <div class="dialog-footer">
              <button class="cancel-button" @click="handleClose">Cancel</button>
              <button
                class="go-button"
                :disabled="goDisabled"
                @click="handleGo"
              >
                <template v-if="loading">
                  <span class="spinner" />
                  Loading…
                </template>
                <template v-else>
                  Import Data
                </template>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
</template>

<style scoped>
/* Overlay */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* Container */
.dialog-container {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Header */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #3b82f6;
  flex-shrink: 0;
}

.dialog-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  color: #0f172a;
  line-height: 1.3;
}

.dialog-subtitle {
  margin: 0;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.3;
}

.close-button {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 6px;
  border-radius: 8px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.close-button:hover {
  background: #f1f5f9;
  color: #475569;
}

/* Body */
.dialog-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Drop zone wrapper */
.drop-zone-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
}

.label-icon {
  font-size: 0.9rem;
}

.label-hint {
  font-weight: 400;
  color: #94a3b8;
  font-size: 0.75rem;
}

/* Drop zone */
.drop-zone {
  position: relative;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.drop-zone:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background: #eff6ff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: #bbf7d0;
  background: #f0fdf4;
  cursor: default;
  padding: 14px 16px;
}

.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* Empty state */
.drop-zone-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.drop-icon {
  color: #cbd5e1;
  transition: color 0.2s;
}

.drag-over .drop-icon {
  color: #3b82f6;
}

.drop-text {
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: center;
}

.browse-link {
  color: #3b82f6;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.15s;
}

.drop-zone:hover .browse-link {
  text-decoration-color: #3b82f6;
}

/* File selected state */
.drop-zone-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.file-icon-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #dcfce7;
  color: #16a34a;
  flex-shrink: 0;
}

.file-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-size: 0.82rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.72rem;
  color: #94a3b8;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Error */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.82rem;
}

/* Footer */
.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #fafbfc;
}

.cancel-button {
  padding: 9px 18px;
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.go-button {
  padding: 9px 22px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.3);
}

.go-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}

.go-button:active:not(:disabled) {
  transform: translateY(0);
}

.go-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

/* Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.overlay-enter-active { transition: opacity 0.2s ease; }
.overlay-leave-active { transition: opacity 0.15s ease; }
.overlay-enter-from,
.overlay-leave-to { opacity: 0; }

.dialog-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.dialog-leave-active { transition: all 0.15s ease; }
.dialog-enter-from { opacity: 0; transform: scale(0.95) translateY(8px); }
.dialog-leave-to { opacity: 0; transform: scale(0.97); }

.error-enter-active { transition: all 0.2s ease; }
.error-leave-active { transition: all 0.15s ease; }
.error-enter-from,
.error-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
