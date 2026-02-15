import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabNavigator from './TabNavigator.vue'
import type { TabId } from '../types/ticket'

const defaultTabs: { id: TabId; label: string }[] = [
  { id: 'statistics', label: 'Statistics' },
  { id: 'all', label: 'All Activities' },
  { id: 'conferences', label: '3P Conferences Goals' },
  { id: 'students', label: 'Students Activities' },
]

describe('TabNavigator', () => {
  it('renders four tab buttons with correct labels', () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'all', tabs: defaultTabs },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(4)
    expect(buttons[0].text()).toBe('Statistics')
    expect(buttons[1].text()).toBe('All Activities')
    expect(buttons[2].text()).toBe('3P Conferences Goals')
    expect(buttons[3].text()).toBe('Students Activities')
  })

  it('has Statistics as the first tab (Requirement 1.1)', () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'statistics', tabs: defaultTabs },
    })
    const firstButton = wrapper.findAll('button')[0]
    expect(firstButton.text()).toBe('Statistics')
    expect(firstButton.classes()).toContain('active')
  })

  it('marks the active tab with the active class', () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'conferences', tabs: defaultTabs },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].classes()).not.toContain('active')
    expect(buttons[1].classes()).not.toContain('active')
    expect(buttons[2].classes()).toContain('active')
    expect(buttons[3].classes()).not.toContain('active')
  })

  it('sets aria-selected on the active tab', () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'students', tabs: defaultTabs },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('aria-selected')).toBe('false')
    expect(buttons[1].attributes('aria-selected')).toBe('false')
    expect(buttons[2].attributes('aria-selected')).toBe('false')
    expect(buttons[3].attributes('aria-selected')).toBe('true')
  })

  it('emits update:activeTab with the tab id on click', async () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'all', tabs: defaultTabs },
    })
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('update:activeTab')).toEqual([['conferences']])
  })

  it('emits correct tab id for each button', async () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'all', tabs: defaultTabs },
    })
    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    await buttons[2].trigger('click')
    await buttons[3].trigger('click')
    expect(wrapper.emitted('update:activeTab')).toEqual([
      ['statistics'],
      ['all'],
      ['conferences'],
      ['students'],
    ])
  })

  it('renders only the tabs provided via prop', () => {
    const subset: { id: TabId; label: string }[] = [
      { id: 'community-goals', label: 'Community Goals' },
    ]
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'community-goals', tabs: subset },
    })
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].text()).toBe('Community Goals')
  })

  it('renders slot content in the actions area', () => {
    const wrapper = mount(TabNavigator, {
      props: { activeTab: 'all', tabs: defaultTabs },
      slots: {
        actions: '<button class="test-action">Load data</button>',
      },
    })
    const actionsArea = wrapper.find('.tab-actions')
    expect(actionsArea.exists()).toBe(true)
    expect(actionsArea.find('.test-action').exists()).toBe(true)
    expect(actionsArea.text()).toContain('Load data')
  })
})
