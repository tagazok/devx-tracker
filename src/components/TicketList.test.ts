import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TicketList from './TicketList.vue'
import StatusGroup from './StatusGroup.vue'
import type { Ticket } from '../types/ticket'

function makeTicket(overrides: Partial<Ticket> & { extensions: Ticket['extensions'] }): Ticket {
  return {
    title: 'Test',
    id: '1',
    aliases: [],
    labels: [],
    customFields: { string: [], date: [], boolean: [], number: [] },
    description: '',
    descriptionContentType: 'text/plain',
    ...overrides,
  }
}

const assigned: Ticket = makeTicket({
  id: 'a1',
  title: 'Assigned ticket',
  extensions: { tt: { status: 'Assigned' } },
})

const accepted: Ticket = makeTicket({
  id: 'a2',
  title: 'Accepted ticket',
  extensions: { tt: { status: 'Pending', computedPendingReason: 'Accepted' } },
})

const resolved: Ticket = makeTicket({
  id: 'a3',
  title: 'Resolved ticket',
  extensions: { tt: { status: 'Resolved' } },
})

describe('TicketList', () => {
  it('renders three StatusGroup components', () => {
    const wrapper = mount(TicketList, {
      props: { tickets: [assigned, accepted, resolved] },
    })
    const groups = wrapper.findAllComponents(StatusGroup)
    expect(groups).toHaveLength(3)
  })

  it('passes correct titles to StatusGroup components', () => {
    const wrapper = mount(TicketList, {
      props: { tickets: [] },
    })
    const groups = wrapper.findAllComponents(StatusGroup)
    expect(groups[0].props('title')).toBe('Backlog')
    expect(groups[1].props('title')).toBe('Accepted')
    expect(groups[2].props('title')).toBe('Resolved')
  })

  it('groups tickets by status correctly', () => {
    const wrapper = mount(TicketList, {
      props: { tickets: [assigned, accepted, resolved] },
    })
    const groups = wrapper.findAllComponents(StatusGroup)
    expect(groups[0].props('tickets')).toEqual([assigned])
    expect(groups[1].props('tickets')).toEqual([accepted])
    expect(groups[2].props('tickets')).toEqual([resolved])
  })

  it('handles empty tickets array', () => {
    const wrapper = mount(TicketList, {
      props: { tickets: [] },
    })
    const groups = wrapper.findAllComponents(StatusGroup)
    expect(groups).toHaveLength(3)
    groups.forEach((g) => {
      expect(g.props('tickets')).toEqual([])
    })
  })
})
