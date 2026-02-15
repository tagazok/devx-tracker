<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { TabId } from './types/ticket'
import type { UploadPayload } from './composables/useDataStore'
import { useDataStore } from './composables/useDataStore'
import { filterByTab } from './utils/ticketFilters'
import TabNavigator from './components/TabNavigator.vue'
import TicketList from './components/TicketList.vue'
import StatisticsPanel from './components/StatisticsPanel.vue'
import CommunityGoalsPanel from './components/CommunityGoalsPanel.vue'
import UploadDialog from './components/UploadDialog.vue'
import LoadDataButton from './components/LoadDataButton.vue'
import FaqPage from './components/FaqPage.vue'

const baseUrl = import.meta.env.BASE_URL

const tabLabelMap: Record<TabId, string> = {
  statistics: 'Statistics',
  all: 'All Activities',
  conferences: '3P Conferences Goals',
  'community-goals': 'Community Goals',
  students: 'Students Activities',
  faq: 'FAQ',
}

const { tickets, meetups, hasData, availableTabs, setData, loadLabels } = useDataStore()

loadLabels()

const dialogOpen = ref(false)

const displayTabs = computed(() =>
  availableTabs.value.map((id) => ({ id, label: tabLabelMap[id] }))
)

function tabFromHash(): TabId {
  const hash = window.location.hash.slice(1)
  return availableTabs.value.includes(hash as TabId)
    ? (hash as TabId)
    : availableTabs.value[0] ?? 'statistics'
}

const activeTab = ref<TabId>(tabFromHash())

watch(activeTab, (tab) => {
  window.location.hash = tab
})

function onHashChange() {
  activeTab.value = tabFromHash()
}

onMounted(() => window.addEventListener('hashchange', onHashChange))
onUnmounted(() => window.removeEventListener('hashchange', onHashChange))

const filteredTickets = computed(() =>
  filterByTab(tickets.value, activeTab.value)
)

function handleUpload(payload: UploadPayload) {
  setData(payload)
  dialogOpen.value = false
  activeTab.value = availableTabs.value[0] ?? 'statistics'
}

function handleClose() {
  dialogOpen.value = false
}
</script>

<template>
  <div id="app">
    <div v-if="!hasData" class="splash">
      <img :src="`${baseUrl}logo.png`" alt="Logo" class="splash-logo" />
      <LoadDataButton variant="hero" @click="dialogOpen = true" />
    </div>
    <template v-else>
      <TabNavigator :active-tab="activeTab" :tabs="displayTabs" @update:active-tab="activeTab = $event">
        <template #actions>
          <LoadDataButton variant="compact" @click="dialogOpen = true" />
        </template>
      </TabNavigator>
      <StatisticsPanel
        v-if="activeTab === 'statistics'"
        :tickets="tickets"
        :meetups="meetups"
      />
      <CommunityGoalsPanel
        v-else-if="activeTab === 'community-goals'"
        :meetups="meetups"
      />
      <FaqPage v-else-if="activeTab === 'faq'" />
      <TicketList
        v-else
        :tickets="filteredTickets"
        :enabled-filters="activeTab === 'all' ? ['assignee', 'organizer', 'engagement', 'cfp', 'cospeaker', 'deu', 'daterange'] : activeTab === 'conferences' ? ['assignee', 'engagement', 'cospeaker', 'deu', 'daterange'] : activeTab === 'students' ? ['assignee', 'engagement', 'organizer', 'cospeaker', 'deu', 'daterange'] : []"
      />
      <footer class="app-footer">
        Built with ❤ <a href="https://www.linkedin.com/in/olivierleplus/" target="_blank">Olivier Leplus</a> & <a href="https://kiro.dev/" target="_blank">Kiro 👻</a>
      </footer>
    </template>
    <UploadDialog :open="dialogOpen" @upload="handleUpload" @close="handleClose" />
  </div>
</template>

<style scoped>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px;
}

.splash {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  background-color: #010e30;
  z-index: 10;
}

.splash-logo {
  max-width: 280px;
  height: auto;
  animation: fadeFloat 1.2s ease-out forwards, hover 3s ease-in-out 1.2s infinite;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes fadeFloat {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hover {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

h1 {
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #1e293b;
}

.error {
  color: #dc2626;
  font-weight: 500;
}

.app-footer {
  margin-top: 48px;
  padding: 24px 0;
  text-align: center;
  font-size: 0.9rem;
  color: #64748b;
  border-top: 1px solid #e2e8f0;
}

.app-footer a {
  color: #3f51b5;
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}
</style>
