import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TicketCard from './TicketCard.vue'
import type { Ticket } from '../types/ticket'

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    title: 'Test Event | Paris | France',
    id: 'abc-123',
    aliases: [{ precedence: '1', id: 'D123456' }],
    labels: [],
    customFields: {
      string: [
        { id: 'city', value: 'Paris' },
        { id: 'country', value: 'France' },
        { id: 'engagement_type', value: 'Workshop delivery' },
        {
          id: 'url_to_public_content_associated_with_this_activity_such_as_speakerdeck_link',
          value: 'https://example.com/slides',
        },
      ],
      date: [{ id: 'date', value: '2026-03-15T00:00:00.000Z' }],
      boolean: [],
      number: [],
    },
    extensions: { tt: { status: 'Assigned' } },
    description: '',
    descriptionContentType: 'text/plain',
    ...overrides,
  }
}

describe('TicketCard', () => {
  it('displays the ticket title (Req 8.1)', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    expect(wrapper.find('.ticket-title').text()).toBe('Test Event | Paris | France')
  })

  it('displays city (Req 8.2) and country (Req 8.3)', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    const location = wrapper.find('.ticket-location')
    expect(location.text()).toContain('Paris')
    expect(location.text()).toContain('France')
  })

  it('displays engagement_type as a styled tag (Req 8.4)', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    const tag = wrapper.find('.engagement-tag')
    expect(tag.exists()).toBe(true)
    expect(tag.text()).toBe('Workshop delivery')
  })

  it('applies workshop color class for workshop engagement type', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    const tag = wrapper.find('.engagement-tag')
    expect(tag.classes()).toContain('tag-workshop')
  })

  it('applies in-person color class for conference engagement type', () => {
    const ticket = makeTicket({
      customFields: {
        string: [
          { id: 'city', value: 'Paris' },
          { id: 'country', value: 'France' },
          { id: 'engagement_type', value: 'In-person event (e.g. conference/meetup)' },
        ],
        date: [],
        boolean: [],
        number: [],
      },
    })
    const wrapper = mount(TicketCard, { props: { ticket, labelMap: {} } })
    const tag = wrapper.find('.engagement-tag')
    expect(tag.classes()).toContain('tag-in-person')
  })

  it('applies online color class for online engagement type', () => {
    const ticket = makeTicket({
      customFields: {
        string: [
          { id: 'city', value: 'Remote' },
          { id: 'engagement_type', value: 'Online event (e.g. webinar/livestream)' },
        ],
        date: [],
        boolean: [],
        number: [],
      },
    })
    const wrapper = mount(TicketCard, { props: { ticket, labelMap: {} } })
    const tag = wrapper.find('.engagement-tag')
    expect(tag.classes()).toContain('tag-online')
  })

  it('displays date in human-readable format (Req 8.5)', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    const dateEl = wrapper.find('.ticket-date')
    expect(dateEl.exists()).toBe(true)
    // Should contain the year and some readable format
    expect(dateEl.text()).toContain('2026')
  })

  it('displays public content link opening in new tab (Req 8.6)', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    const links = wrapper.findAll('.ticket-link')
    const publicLink = links.find((l) => l.text() === 'Content link')
    expect(publicLink).toBeDefined()
    expect(publicLink!.attributes('href')).toBe('https://example.com/slides')
    expect(publicLink!.attributes('target')).toBe('_blank')
  })

  it('displays SIM link opening in new tab (Req 8.7)', () => {
    const wrapper = mount(TicketCard, {
      props: { ticket: makeTicket(), labelMap: {} },
    })
    const links = wrapper.findAll('.ticket-link')
    const simLink = links.find((l) => l.text() === 'SIM Link')
    expect(simLink).toBeDefined()
    expect(simLink!.attributes('href')).toBe('https://sim.amazon.com/issues/D123456')
    expect(simLink!.attributes('target')).toBe('_blank')
  })

  it('omits SIM link when no D-alias exists (Req 8.8)', () => {
    const ticket = makeTicket({
      aliases: [{ precedence: '1', id: 'X999' }],
    })
    const wrapper = mount(TicketCard, {
      props: { ticket, labelMap: {} },
    })
    const links = wrapper.findAll('.ticket-link')
    const simLink = links.find((l) => l.text() === 'SIM Link')
    expect(simLink).toBeUndefined()
  })

  it('omits public content link when field is missing', () => {
    const ticket = makeTicket({
      customFields: {
        string: [
          { id: 'city', value: 'Berlin' },
          { id: 'country', value: 'Germany' },
        ],
        date: [],
        boolean: [],
        number: [],
      },
    })
    const wrapper = mount(TicketCard, {
      props: { ticket, labelMap: {} },
    })
    const links = wrapper.findAll('.ticket-link')
    const publicLink = links.find((l) => l.text() === 'Content link')
    expect(publicLink).toBeUndefined()
  })
})
