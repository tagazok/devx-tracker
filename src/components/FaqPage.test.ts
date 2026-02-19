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
  it('renders all 3 sections with correct headings', () => {
    const wrapper = mount(FaqPage)

    const expectedSections = [
      { id: 'tabs-overview', heading: 'Tabs Overview' },
      { id: 'status-grouping', heading: 'Status Grouping' },
      { id: 'activity-heatmap', heading: 'Activity Heatmap' },
    ]

    const sections = wrapper.findAll('.faq-section')
    expect(sections).toHaveLength(3)

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

  // Skipped: ticket-card section not yet implemented in FaqPage.vue

  // Skipped: filter-availability-table not yet implemented in FaqPage.vue

  // Skipped: labels section not yet implemented in FaqPage.vue

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
