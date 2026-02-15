import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusGroup from './StatusGroup.vue'
import type { Ticket } from '../types/ticket'

function makeTicket(overrides: Partial<Ticket> & { title: string; id: string }): Ticket {
  return {
    aliases: [],
    labels: [],
    customFields: { string: [], date: [], boolean: [], number: [] },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: 'text/plain',
    ...overrides,
  }
}

describe('StatusGroup', () => {
  it('renders the title with ticket count', () => {
    const tickets = [
      makeTicket({ title: 'Ticket A', id: '1' }),
      makeTicket({ title: 'Ticket B', id: '2' }),
    ]
    const wrapper = mount(StatusGroup, {
      props: { title: 'Assigned', tickets, labelMap: {} },
    })

    const header = wrapper.find('.status-header')
    expect(header.text()).toContain('Assigned (2)')
  })

  it('renders a TicketCard for each ticket', () => {
    const tickets = [
      makeTicket({ title: 'Ticket A', id: '1' }),
      makeTicket({ title: 'Ticket B', id: '2' }),
      makeTicket({ title: 'Ticket C', id: '3' }),
    ]
    const wrapper = mount(StatusGroup, {
      props: { title: 'Resolved', tickets, labelMap: {} },
    })

    const cards = wrapper.findAllComponents({ name: 'TicketCard' })
    expect(cards).toHaveLength(3)
  })

  it('renders zero count and no cards when tickets is empty', () => {
    const wrapper = mount(StatusGroup, {
      props: { title: 'Accepted', tickets: [], labelMap: {} },
    })

    expect(wrapper.find('.status-header').text()).toContain('Accepted (0)')
    expect(wrapper.findAllComponents({ name: 'TicketCard' })).toHaveLength(0)
  })
})
