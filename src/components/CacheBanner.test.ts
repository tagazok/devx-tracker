import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CacheBanner from './CacheBanner.vue'

describe('CacheBanner', () => {
  it('does not render when both timestamps are null', () => {
    const wrapper = mount(CacheBanner, {
      props: { ticketsTimestamp: null, meetupsTimestamp: null },
    })

    expect(wrapper.find('.cache-banner').exists()).toBe(false)
  })

  it('renders with only tickets timestamp', () => {
    const wrapper = mount(CacheBanner, {
      props: {
        ticketsTimestamp: '2026-02-14T15:42:00.000Z',
        meetupsTimestamp: null,
      },
    })

    const banner = wrapper.find('.cache-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('Tickets data from')
    expect(banner.text()).not.toContain('Meetups')
  })

  it('renders with only meetups timestamp', () => {
    const wrapper = mount(CacheBanner, {
      props: {
        ticketsTimestamp: null,
        meetupsTimestamp: '2026-02-12T10:15:00.000Z',
      },
    })

    const banner = wrapper.find('.cache-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('Meetups data from')
    expect(banner.text()).not.toContain('Tickets')
  })

  it('renders with both timestamps separated by em dash', () => {
    const wrapper = mount(CacheBanner, {
      props: {
        ticketsTimestamp: '2026-02-14T15:42:00.000Z',
        meetupsTimestamp: '2026-02-12T10:15:00.000Z',
      },
    })

    const banner = wrapper.find('.cache-banner')
    expect(banner.exists()).toBe(true)
    expect(banner.text()).toContain('Tickets data from')
    expect(banner.text()).toContain('Meetups data from')
    expect(banner.text()).toContain('\u2014') // em dash separator
  })
})
