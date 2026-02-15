<script setup lang="ts">
import type { TabId } from '../types/ticket'

defineProps<{
  activeTab: TabId
  tabs: { id: TabId; label: string }[]
}>()

const emit = defineEmits<{
  'update:activeTab': [tabId: TabId]
}>()
</script>

<template>
  <nav class="tab-navigator" role="tablist">
    <div class="tab-list">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="['tab-button', { active: activeTab === tab.id }]"
        @click="emit('update:activeTab', tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-actions">
      <slot name="actions" />
    </div>
  </nav>
</template>

<style scoped>
.tab-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .tab-navigator {
    flex-direction: column;
    align-items: stretch;
  }
}

.tab-list {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .tab-list {
    width: 100%;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
  }
}

.tab-actions {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .tab-actions {
    width: 100%;
    justify-content: center;
  }
}

.tab-button {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .tab-button {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
}

.tab-button:hover {
  color: #334155;
}

.tab-button.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
  font-weight: 600;
}
</style>
