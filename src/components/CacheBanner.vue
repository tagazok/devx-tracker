<script setup lang="ts">
import { computed } from 'vue'
import { buildCacheBannerMessage } from '../utils/cacheFormatters'

const props = defineProps<{
  ticketsTimestamp: string | null
  meetupsTimestamp: string | null
}>()

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

function isStale(iso: string | null): boolean {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() > TWELVE_HOURS_MS
}

const showBanner = computed(() =>
  isStale(props.ticketsTimestamp) || isStale(props.meetupsTimestamp),
)

const bannerMessage = computed(() =>
  buildCacheBannerMessage(props.ticketsTimestamp, props.meetupsTimestamp),
)
</script>

<template>
  <div v-if="showBanner && bannerMessage" class="cache-banner">
    {{ bannerMessage }}
  </div>
</template>

<style scoped>
.cache-banner {
  font-size: 0.78rem;
  color: #fff;
  background: #dc2626;
  text-align: center;
  padding: 8px 12px;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}
</style>
