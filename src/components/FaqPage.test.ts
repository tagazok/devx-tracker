import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FaqPage from './FaqPage.vue'

describe('FaqPage', () => {
  // **Validates: Requirements 2.1**
  it('renders the title "Frequently Asked Questions" and an introduction paragraph', () => {
    const wrapper = mount(FaqPage)

    expect(wrapper.find('.faq-title').text()).toBe('Frequently Asked Questions')

    const intro = wrapper.find('.faq-intro')
    expect(intro.exists()).toBe(true)
    expect(intro.text().length).toBeGreaterThan(0)

    wrapper.unmount()
  })

  // **Validates: Requirements 2.2**
  it('renders all 7 sections with correct headings', () => {
    const wrapper = mount(FaqPage)

    const expectedSections = [
      { id: 'ticket-structure', heading: 'Ticket Structure' },
      { id: 'status-grouping', heading: 'Status Grouping' },
      { id: 'tabs-overview', heading: 'Tabs Overview' },
      { id: 'filters', heading: 'Filters' },
      { id: 'labels', heading: 'Labels' },
      { id: 'ticket-card', heading: 'Ticket Card Display' },
      { id: 'activity-heatmap', heading: 'Activity Heatmap' },
    ]

    const sections = wrapper.findAll('.faq-section')
    expect(sections).toHaveLength(7)

    for (const expected of expectedSections) {
      const section = wrapper.find(`#${expected.id}`)
      expect(section.exists()).toBe(true)
      const heading = section.find('.section-heading')
      expect(heading.text()).toContain(expected.heading)
    }

    wrapper.unmount()
  })

  // **Validates: Requirements 4.1**
  it('status grouping section mentions all status values', () => {
    const wrapper = mount(FaqPage)

    const statusSection = wrapper.find('#status-grouping')
    expect(statusSection.exists()).toBe(true)

    const text = statusSection.text()
    const expectedStatuses = ['Assigned', 'Under Consideration', 'In Progress', 'Resolved', 'Backlog', 'Accepted']

    for (const status of expectedStatuses) {
      expect(text).toContain(status)
    }

    wrapper.unmount()
  })

  // **Validates: Requirements 5.1**
  it('tab documentation mentions all tabs and their criteria', () => {
    const wrapper = mount(FaqPage)

    const tabsSection = wrapper.find('#tabs-overview')
    expect(tabsSection.exists()).toBe(true)

    const text = tabsSection.text()
    const expectedTabs = [
      'All Activities',
      '3P Conferences Goals',
      'Students Activities',
      'Statistics',
      'Community Goals',
    ]

    for (const tab of expectedTabs) {
      expect(text).toContain(tab)
    }

    // Verify filtering criteria are documented
    expect(text).toContain('CFP_Submitted: Yes')
    expect(text).toContain('CFP_Accepted: Yes')
    expect(text).toContain('Segment: Students')

    wrapper.unmount()
  })

  // **Validates: Requirements 8.2**
  it('ticket card section documents engagement type color coding', () => {
    const wrapper = mount(FaqPage)

    const cardSection = wrapper.find('#ticket-card')
    expect(cardSection.exists()).toBe(true)

    const text = cardSection.text()

    // Blue / In-Person
    expect(text).toContain('In-Person')
    expect(text).toContain('Blue')

    // Yellow / Workshop
    expect(text).toContain('Workshop')
    expect(text).toContain('Yellow')

    // Green / Online
    expect(text).toContain('Online')
    expect(text).toContain('Green')

    wrapper.unmount()
  })

  // **Validates: Requirements 6.9**
  it('filter availability table exists', () => {
    const wrapper = mount(FaqPage)

    const table = wrapper.find('.filter-availability-table')
    expect(table.exists()).toBe(true)

    // Verify the table has the expected tab column headers
    const text = table.text()
    expect(text).toContain('All Activities')
    expect(text).toContain('3P Conferences Goals')
    expect(text).toContain('Students Activities')

    wrapper.unmount()
  })

  // **Validates: Requirements 7.2**
  it('labels section lists all categories', () => {
    const wrapper = mount(FaqPage)

    const labelsSection = wrapper.find('#labels')
    expect(labelsSection.exists()).toBe(true)

    const text = labelsSection.text()
    const expectedCategories = ['Theme', 'Segment', 'Program', 'Language', 'Industry', 'CFP', 'Global Level']

    for (const category of expectedCategories) {
      expect(text).toContain(category)
    }

    wrapper.unmount()
  })

  // **Validates: Requirements 9.1**
  it('heatmap section documents click-to-filter and click-again-to-clear behavior', () => {
    const wrapper = mount(FaqPage)

    const heatmapSection = wrapper.find('#activity-heatmap')
    expect(heatmapSection.exists()).toBe(true)

    const text = heatmapSection.text()

    // Click-to-filter
    expect(text).toMatch(/click.*date.*filter|filter.*click/i)

    // Click-again-to-clear
    expect(text).toMatch(/click.*same.*date.*clear|click.*again.*clear/i)

    wrapper.unmount()
  })
})
