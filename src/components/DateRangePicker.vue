<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  startDate: string
  endDate: string
}>()

const emit = defineEmits<{
  'update:startDate': [value: string]
  'update:endDate': [value: string]
}>()

const open = ref(false)
const picking = ref<'start' | 'end'>('start')
const hoverDate = ref('')
const containerRef = ref<HTMLElement | null>(null)

const today = new Date()
const viewMonth = ref(today.getMonth())
const viewYear = ref(today.getFullYear())

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pad(n: number) { return String(n).padStart(2, '0') }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function parseDate(s: string) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDisplay(iso: string) {
  if (!iso) return ''
  const d = parseDate(iso)
  if (!d) return ''
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
}

const displayText = computed(() => {
  if (!props.startDate && !props.endDate) return 'All dates'
  const s = formatDisplay(props.startDate)
  const e = formatDisplay(props.endDate)
  if (s && e) return `${s} – ${e}`
  if (s) return `From ${s}`
  return `Until ${e}`
})

const hasValue = computed(() => !!props.startDate || !!props.endDate)

const leftMonth = computed(() => ({ month: viewMonth.value, year: viewYear.value }))
const rightMonth = computed(() => {
  const m = viewMonth.value + 1
  return m > 11 ? { month: 0, year: viewYear.value + 1 } : { month: m, year: viewYear.value }
})

function monthLabel(m: { month: number; year: number }) {
  return `${MONTHS[m.month]} ${m.year}`
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfWeek(month: number, year: number) {
  return new Date(year, month, 1).getDay()
}

function calendarDays(m: { month: number; year: number }) {
  const total = daysInMonth(m.month, m.year)
  const offset = firstDayOfWeek(m.month, m.year)
  const days: (string | null)[] = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= total; d++) {
    days.push(toISO(new Date(m.year, m.month, d)))
  }
  return days
}

function isInRange(dateStr: string) {
  const s = props.startDate
  const e = props.endDate || hoverDate.value
  if (!s || !e) return false
  const lo = s < e ? s : e
  const hi = s < e ? e : s
  return dateStr >= lo && dateStr <= hi
}

function isStart(dateStr: string) { return dateStr === props.startDate }
function isEnd(dateStr: string) { return dateStr === (props.endDate || hoverDate.value) }
function isToday(dateStr: string) { return dateStr === toISO(today) }

function selectDate(dateStr: string) {
  if (picking.value === 'start') {
    emit('update:startDate', dateStr)
    emit('update:endDate', '')
    picking.value = 'end'
  } else {
    if (dateStr < props.startDate) {
      emit('update:startDate', dateStr)
      emit('update:endDate', '')
      picking.value = 'end'
    } else {
      emit('update:endDate', dateStr)
      picking.value = 'start'
      open.value = false
    }
  }
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    picking.value = 'start'
    if (props.startDate) {
      const d = parseDate(props.startDate)
      if (d) { viewMonth.value = d.getMonth(); viewYear.value = d.getFullYear() }
    }
  }
}

function clearDates(e: Event) {
  e.stopPropagation()
  emit('update:startDate', '')
  emit('update:endDate', '')
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
function onEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onEscape)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onEscape)
})
</script>

<template>
  <div ref="containerRef" class="drp">
    <button class="drp-trigger" @click="toggle" aria-label="Period">
      {{ displayText }}
      <span v-if="hasValue" class="drp-clear" @click="clearDates" aria-label="Clear dates">×</span>
      <span v-else class="drp-chevron">▾</span>
    </button>
    <div v-if="open" class="drp-dropdown">
      <div class="drp-header">
        <button class="drp-nav" @click="prevMonth" aria-label="Previous month">&lsaquo;</button>
        <span class="drp-month-label">{{ monthLabel(leftMonth) }}</span>
        <span class="drp-month-label">{{ monthLabel(rightMonth) }}</span>
        <button class="drp-nav" @click="nextMonth" aria-label="Next month">&rsaquo;</button>
      </div>
      <div class="drp-calendars">
        <div class="drp-cal">
          <div class="drp-weekdays">
            <span v-for="d in DAYS" :key="d" class="drp-wd">{{ d }}</span>
          </div>
          <div class="drp-days">
            <template v-for="(day, i) in calendarDays(leftMonth)" :key="'l'+i">
              <span v-if="!day" class="drp-day empty"></span>
              <button
                v-else
                class="drp-day"
                :class="{
                  'in-range': isInRange(day),
                  'range-start': isStart(day),
                  'range-end': isEnd(day),
                  'today': isToday(day),
                }"
                @click="selectDate(day)"
                @mouseenter="hoverDate = day"
              >{{ parseInt(day.split('-')[2]) }}</button>
            </template>
          </div>
        </div>
        <div class="drp-cal">
          <div class="drp-weekdays">
            <span v-for="d in DAYS" :key="d" class="drp-wd">{{ d }}</span>
          </div>
          <div class="drp-days">
            <template v-for="(day, i) in calendarDays(rightMonth)" :key="'r'+i">
              <span v-if="!day" class="drp-day empty"></span>
              <button
                v-else
                class="drp-day"
                :class="{
                  'in-range': isInRange(day),
                  'range-start': isStart(day),
                  'range-end': isEnd(day),
                  'today': isToday(day),
                }"
                @click="selectDate(day)"
                @mouseenter="hoverDate = day"
              >{{ parseInt(day.split('-')[2]) }}</button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drp { position: relative; }

.drp-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #334155;
  background: #fff;
  cursor: pointer;
}
.drp-trigger:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
.drp-chevron { font-size: 0.7rem; }
.drp-clear {
  font-size: 0.85rem;
  color: #94a3b8;
  margin-left: 2px;
  line-height: 1;
}
.drp-clear:hover { color: #334155; }

.drp-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 30;
  padding: 12px;
  min-width: 480px;
}

.drp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.drp-nav {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #64748b;
  padding: 4px 8px;
  border-radius: 4px;
}
.drp-nav:hover { background: #f1f5f9; }
.drp-month-label { font-size: 0.9rem; font-weight: 600; color: #1e293b; flex: 1; text-align: center; }

.drp-calendars { display: flex; gap: 16px; }
.drp-cal { flex: 1; }

.drp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 4px; }
.drp-wd { font-size: 0.75rem; color: #94a3b8; font-weight: 500; padding: 4px 0; }

.drp-days { display: grid; grid-template-columns: repeat(7, 1fr); }
.drp-day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  font-size: 0.8rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #334155;
  border-radius: 0;
  padding: 0;
}
.drp-day.empty { cursor: default; }
.drp-day:not(.empty):hover { background: #e2e8f0; border-radius: 50%; }
.drp-day.in-range { background: #dbeafe; }
.drp-day.range-start { background: #3b82f6; color: #fff; border-radius: 50% 0 0 50%; }
.drp-day.range-end { background: #3b82f6; color: #fff; border-radius: 0 50% 50% 0; }
.drp-day.range-start.range-end { border-radius: 50%; }
.drp-day.today:not(.range-start):not(.range-end) { border: 1px solid #94a3b8; border-radius: 50%; }
</style>
