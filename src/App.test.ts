import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from './App.vue'
import TicketList from './components/TicketList.vue'
import { useDataStore } from './composables/useDataStore'
import type { Ticket } from './types/ticket'

const stubTicket: Ticket = {
  title: 'Test',
  id: 't-1',
  aliases: [],
  labels: [],
  customFields: { string: [], date: [], boolean: [], number: [] },
  extensions: { tt: { status: 'Assigned' } },
  description: '',
  descriptionContentType: 'text/plain',
}

beforeEach(() => {
  window.location.hash = ''
  const { setData } = useDataStore()
  setData({ tickets: [stubTicket], meetups: [] })
})

afterEach(() => {
  const { reset } = useDataStore()
  reset()
})

describe('Tab enabledFilters includes daterange', () => {
  it('includes "daterange" when the "all" tab is active (Requirement 4.1)', async () => {
    window.location.hash = '#all'
    const wrapper = mount(App)
    await flushPromises()
    const ticketList = wrapper.findComponent(TicketList)
    expect(ticketList.exists()).toBe(true)
    expect(ticketList.props('enabledFilters')).toContain('daterange')
    wrapper.unmount()
  })

  it('includes "daterange" when the "conferences" tab is active (Requirement 4.2)', async () => {
    window.location.hash = '#conferences'
    const wrapper = mount(App)
    await flushPromises()
    const ticketList = wrapper.findComponent(TicketList)
    expect(ticketList.exists()).toBe(true)
    expect(ticketList.props('enabledFilters')).toContain('daterange')
    wrapper.unmount()
  })

  it('includes "daterange" when the "students" tab is active (Requirement 4.3)', async () => {
    window.location.hash = '#students'
    const wrapper = mount(App)
    await flushPromises()
    const ticketList = wrapper.findComponent(TicketList)
    expect(ticketList.exists()).toBe(true)
    expect(ticketList.props('enabledFilters')).toContain('daterange')
    wrapper.unmount()
  })
})
