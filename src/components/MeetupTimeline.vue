<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  monthlyCounts: number[]
  monthlyEventTitles: string[][]
  year: number
}>()

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAST_COLOR = '#22c55e'
const UPCOMING_COLOR = '#3b82f6'
const EMPTY_COLOR = '#e2e8f0'

function cellColor(monthIndex: number): string {
  if (props.monthlyCounts[monthIndex] === 0) return EMPTY_COLOR
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11
  if (props.year < currentYear) return PAST_COLOR
  if (props.year > currentYear) return UPCOMING_COLOR
  return monthIndex <= currentMonth ? PAST_COLOR : UPCOMING_COLOR
}

const hoveredMonth = ref<number | null>(null)
const tooltipStyle = ref<Record<string, string>>({})

function onCellEnter(index: number, event: MouseEvent) {
  if (props.monthlyCounts[index] === 0) return
  hoveredMonth.value = index
  const target = event.currentTarget as HTMLElement
  const container = target.closest('.timeline-container') as HTMLElement
  if (container) {
    const cellRect = target.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    tooltipStyle.value = {
      left: `${cellRect.left - containerRect.left + cellRect.width / 2}px`,
      top: `${cellRect.top - containerRect.top - 8}px`,
    }
  }
}

function onCellLeave() {
  hoveredMonth.value = null
}
</script>

<template>
  <div class="timeline-container">
    <div class="timeline-row">
      <div v-for="(label, i) in MONTH_LABELS" :key="label" class="timeline-column">
        <span class="month-label">{{ label }}</span>
        <div
          class="timeline-cell"
          :style="{ backgroundColor: cellColor(i) }"
          @mouseenter="onCellEnter(i, $event)"
          @mouseleave="onCellLeave"
        >
          <span v-if="monthlyCounts[i] > 1" class="cell-count">{{ monthlyCounts[i] }}</span>
        </div>
      </div>
    </div>

    <div v-if="hoveredMonth !== null" class="timeline-tooltip" :style="tooltipStyle">
      <div class="tooltip-month">{{ MONTH_LABELS[hoveredMonth] }}</div>
      <div
        v-for="(title, idx) in monthlyEventTitles[hoveredMonth]"
        :key="idx"
        class="tooltip-title"
      >
        {{ title }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-container {
  position: relative;
}

.timeline-row {
  display: flex;
  gap: 2px;
}

.timeline-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.month-label {
  font-size: 0.7rem;
  color: #64748b;
  line-height: 1;
}

.timeline-cell {
  width: 14px;
  height: 14px;
  max-height: 14px;
  max-width: 14px;
  border-radius: 2px;
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-count {
  font-size: 0.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.4);
}

.timeline-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: #1e293b;
  color: #f1f5f9;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.tooltip-month {
  font-weight: 600;
  margin-bottom: 4px;
  color: #e2e8f0;
}

.tooltip-title {
  padding-left: 6px;
  color: #f1f5f9;
}
</style>
