<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Ticket } from '../types/ticket'
import { buildHeatmapGrid } from '../utils/heatmapHelpers'
import type { HeatmapCell } from '../utils/heatmapHelpers'

const props = defineProps<{
  tickets: Ticket[]
}>()

const emit = defineEmits<{
  'select-date': [date: string]
}>()

const grid = computed(() => buildHeatmapGrid(props.tickets))

const hoveredCell = ref<HeatmapCell | null>(null)
const tooltipStyle = ref<Record<string, string>>({})

const STATUS_COLORS: Record<string, string> = {
  assigned: '#94a3b8',
  accepted: '#3b82f6',
  resolved: '#22c55e',
}

const EMPTY_COLOR = '#e2e8f0'

const DAY_LABELS: Record<number, string> = {
  1: 'Mon',
  3: 'Wed',
  5: 'Fri',
}

function cellColor(cell: HeatmapCell | null): string {
  if (!cell || !cell.dominantStatus) return EMPTY_COLOR
  return STATUS_COLORS[cell.dominantStatus] ?? EMPTY_COLOR
}

function onCellEnter(cell: HeatmapCell | null, event: MouseEvent) {
  if (!cell || cell.tickets.length === 0) return
  hoveredCell.value = cell
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const container = target.closest('.heatmap-container')
  if (container) {
    const containerRect = container.getBoundingClientRect()
    tooltipStyle.value = {
      left: `${rect.left - containerRect.left + rect.width / 2}px`,
      top: `${rect.top - containerRect.top - 8}px`,
    }
  }
}

function onCellLeave() {
  hoveredCell.value = null
}

function onCellClick(cell: HeatmapCell | null) {
  if (!cell || cell.tickets.length === 0) return
  emit('select-date', cell.date)
}

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function groupedTickets(cell: HeatmapCell) {
  const groups: Record<string, string[]> = {}
  for (const t of cell.tickets) {
    if (!groups[t.status]) groups[t.status] = []
    groups[t.status].push(t.title)
  }
  return groups
}

const STATUS_ORDER = ['resolved', 'accepted', 'assigned']

const todayStr = computed(() => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})
</script>

<template>
  <div v-if="grid" class="heatmap-container">
    <div class="month-labels" :style="{ gridTemplateColumns: `auto repeat(${grid.weekCount}, 1fr)` }">
      <div class="month-label-spacer"></div>
      <template v-for="week in grid.weekCount" :key="'mw-' + week">
        <div class="month-label-cell">
          <template v-for="ml in grid.monthLabels" :key="ml.label + ml.weekIndex">
            <span v-if="ml.weekIndex === week - 1" class="month-label">{{ ml.label }}</span>
          </template>
        </div>
      </template>
    </div>

    <div class="heatmap-grid" :style="{ gridTemplateColumns: `auto repeat(${grid.weekCount}, 1fr)` }">
      <template v-for="day in 7" :key="'row-' + day">
        <div class="day-label">
          {{ DAY_LABELS[day - 1] ?? '' }}
        </div>
        <div
          v-for="week in grid.weekCount"
          :key="'cell-' + day + '-' + week"
          class="heatmap-cell"
          :class="{
            'has-count': grid.cells[day - 1]?.[week - 1]?.tickets.length ?? 0 > 1,
            'today': grid.cells[day - 1]?.[week - 1]?.date === todayStr,
            'clickable': (grid.cells[day - 1]?.[week - 1]?.tickets.length ?? 0) >= 1,
          }"
          :style="{ backgroundColor: cellColor(grid.cells[day - 1]?.[week - 1] ?? null) }"
          @click="onCellClick(grid.cells[day - 1]?.[week - 1] ?? null)"
          @mouseenter="onCellEnter(grid.cells[day - 1]?.[week - 1] ?? null, $event)"
          @mouseleave="onCellLeave"
        >
          <span
            v-if="grid.cells[day - 1]?.[week - 1]?.tickets.length ?? 0 > 1"
            class="cell-count"
          >{{ grid.cells[day - 1]?.[week - 1]?.tickets.length }}</span>
        </div>
      </template>
    </div>

    <div v-if="hoveredCell" class="heatmap-tooltip" :style="tooltipStyle">
      <div class="tooltip-date">{{ formatTooltipDate(hoveredCell.date) }}</div>
      <template v-for="status in STATUS_ORDER" :key="status">
        <div v-if="groupedTickets(hoveredCell)[status]" class="tooltip-group">
          <div v-for="title in groupedTickets(hoveredCell)[status]" :key="title" class="tooltip-ticket">
            {{ title }}
          </div>
        </div>
      </template>
    </div>

    <div class="heatmap-legend">
      <div class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: '#94a3b8' }"></span>
        <span class="legend-text">Assigned</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: '#3b82f6' }"></span>
        <span class="legend-text">Accepted</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: '#22c55e' }"></span>
        <span class="legend-text">Resolved</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" :style="{ backgroundColor: '#e2e8f0' }"></span>
        <span class="legend-text">No activity</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.heatmap-container {
  position: relative;
  width: 100%;
  margin-bottom: 20px;
}

.month-labels {
  display: grid;
  gap: 2px;
  margin-bottom: 2px;
}

.month-label-spacer {
  min-width: 30px;
}

.month-label-cell {
  font-size: 0.7rem;
  color: #64748b;
  height: 14px;
  line-height: 14px;
  overflow: hidden;
}

.month-label {
  white-space: nowrap;
}

.heatmap-grid {
  display: grid;
  gap: 2px;
}

.day-label {
  font-size: 0.65rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  min-width: 30px;
  height: 12px;
}

.heatmap-cell {
  width: 100%;
  aspect-ratio: 1;
  max-height: 14px;
  max-width: 14px;
  border-radius: 2px;
  cursor: default;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heatmap-cell.clickable {
  cursor: pointer;
}

.heatmap-cell.today {
  outline: 1.5px solid #ef4444;
  outline-offset: -1px;
}

.cell-count {
  font-size: 0.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.4);
}

.heatmap-tooltip {
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

.tooltip-date {
  font-weight: 600;
  margin-bottom: 4px;
  color: #e2e8f0;
}

.tooltip-group {
  margin-top: 4px;
}

.tooltip-status {
  font-weight: 600;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #94a3b8;
  margin-bottom: 1px;
}

.tooltip-ticket {
  padding-left: 6px;
  color: #f1f5f9;
}

.heatmap-legend {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-text {
  font-size: 0.7rem;
  color: #64748b;
}
</style>
