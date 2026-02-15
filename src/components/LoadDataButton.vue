<script setup lang="ts">
defineProps<{
  variant: 'hero' | 'compact'
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <button
    :class="['load-data-button', variant]"
    @click="handleClick"
  >
    Load data
  </button>
</template>

<style scoped>
.load-data-button {
  font-family: system-ui, -apple-system, sans-serif;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  background: #3b82f6;
  color: #fff;
  transition: background 0.15s;
}

.load-data-button:hover {
  background: #2563eb;
}

.load-data-button.hero {
  font-size: 1.1rem;
  padding: 12px 32px;
}

.load-data-button.compact {
  font-size: 0.8rem;
  padding: 6px 14px;
}
</style>
