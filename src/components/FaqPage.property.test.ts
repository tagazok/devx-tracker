// Feature: faq-page, Property 2: Table of contents anchor integrity
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import * as fc from 'fast-check'
import FaqPage from './FaqPage.vue'

// ---------------------------------------------------------------------------
// Property 2: Table of contents anchor integrity
// ---------------------------------------------------------------------------

describe('Property 2: Table of contents anchor integrity', () => {
  // **Validates: Requirements 2.3**

  it('every anchor link in the table of contents has a matching section id in the DOM', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const wrapper = mount(FaqPage)

        const tocLinks = wrapper.findAll('.toc-link')

        // The TOC must have at least one link
        expect(tocLinks.length).toBeGreaterThan(0)

        for (const link of tocLinks) {
          const href = link.attributes('href')
          expect(href).toBeDefined()
          expect(href!.startsWith('#')).toBe(true)

          const sectionId = href!.slice(1) // remove the '#' prefix
          expect(sectionId.length).toBeGreaterThan(0)

          // A section element with this id must exist in the rendered DOM
          const matchingSection = wrapper.find(`#${sectionId}`)
          expect(matchingSection.exists()).toBe(true)
        }

        wrapper.unmount()
      }),
      { numRuns: 100 },
    )
  })

  it('each TOC anchor href maps to exactly one section element', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const wrapper = mount(FaqPage)

        const tocLinks = wrapper.findAll('.toc-link')
        const seenIds = new Set<string>()

        for (const link of tocLinks) {
          const sectionId = link.attributes('href')!.slice(1)

          // Each anchor should point to a unique section
          expect(seenIds.has(sectionId)).toBe(false)
          seenIds.add(sectionId)

          // Exactly one element with this id should exist
          const matches = wrapper.findAll(`#${sectionId}`)
          expect(matches.length).toBe(1)
        }

        wrapper.unmount()
      }),
      { numRuns: 100 },
    )
  })

  it('the number of TOC links matches the number of FAQ sections', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const wrapper = mount(FaqPage)

        const tocLinks = wrapper.findAll('.toc-link')
        const sections = wrapper.findAll('.faq-section')

        expect(tocLinks.length).toBe(sections.length)

        wrapper.unmount()
      }),
      { numRuns: 100 },
    )
  })
})

// ---------------------------------------------------------------------------
// Feature: faq-page, Property 3: Filter sections document field and format
// ---------------------------------------------------------------------------

describe('Property 3: Filter sections document field and format', () => {
  // **Validates: Requirements 6.2**

  const filterFieldMap: Array<{ filter: string; fieldName: string }> = [
    { filter: 'Assignee', fieldName: 'assigneeIdentity' },
    { filter: 'Organizer', fieldName: 'activity_organizer' },
    { filter: 'Engagement Type', fieldName: 'engagement_type' },
    { filter: 'CFP', fieldName: 'CFP_Submitted' },
    { filter: 'Co-speaker', fieldName: 'secondary_da_aliases' },
    { filter: 'Date Range', fieldName: 'date' },
  ]

  it('each filter section contains its corresponding field name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...filterFieldMap),
        (entry) => {
          const wrapper = mount(FaqPage)

          const filtersSection = wrapper.find('#filters')
          expect(filtersSection.exists()).toBe(true)

          const sectionText = filtersSection.text()
          expect(sectionText).toContain(entry.fieldName)

          wrapper.unmount()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('all expected filters are documented in the filters section', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const wrapper = mount(FaqPage)

        const filtersSection = wrapper.find('#filters')
        expect(filtersSection.exists()).toBe(true)

        const sectionText = filtersSection.text()

        for (const entry of filterFieldMap) {
          expect(sectionText).toContain(entry.fieldName)
        }

        wrapper.unmount()
      }),
      { numRuns: 100 },
    )
  })
})
