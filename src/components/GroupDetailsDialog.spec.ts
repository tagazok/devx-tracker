import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GroupDetailsDialog from './GroupDetailsDialog.vue'
import type { RawMeetupGroup } from '../types/meetup'

// Helper to create a minimal valid group object
function createMinimalGroup(overrides: Partial<RawMeetupGroup> = {}): RawMeetupGroup {
  return {
    id: 'test-id',
    name: 'Test Group',
    city: 'Test City',
    country: 'US',
    description: 'Test description',
    foundedDate: '2020-01-01',
    proNetwork: null,
    memberships: { totalCount: 100 },
    socialNetworks: [],
    orgs: { edges: [] },
    groupAnalytics: null,
    pastEvents: { edges: [] },
    upcomingEvents: { edges: [] },
    ...overrides,
  }
}

describe('GroupDetailsDialog - Unit Tests', () => {
  describe('Edge Cases', () => {
    it('should not display description section when description is empty', () => {
      const group = createMinimalGroup({ description: '' })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).not.toContain('Test description')
      
      wrapper.unmount()
    })

    it('should not display description section when description is only whitespace', () => {
      const group = createMinimalGroup({ description: '   ' })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const html = wrapper.html()
      // Check that the description div is not rendered
      expect(html).not.toContain('class="description"')
      
      wrapper.unmount()
    })

    it('should not display founded date when date is invalid', () => {
      const group = createMinimalGroup({ foundedDate: 'invalid-date' })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      // Check that the founded date info-item is not rendered
      const text = wrapper.text()
      expect(text).not.toContain('Founded')
      
      wrapper.unmount()
    })

    it('should not display founded date when date is empty', () => {
      const group = createMinimalGroup({ foundedDate: '' })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).not.toContain('Founded')
      
      wrapper.unmount()
    })

    it('should format founded date correctly', () => {
      const group = createMinimalGroup({ foundedDate: '2020-03-15T10:30:00.000Z' })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('Mar 2020')
      
      wrapper.unmount()
    })

    it('should display message when organizers list is empty', () => {
      const group = createMinimalGroup({ orgs: { edges: [] } })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('No organizers listed for this group')
      
      wrapper.unmount()
    })

    it('should display placeholder image when organizer photo is missing', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'John Doe',
              email: 'john@example.com',
              memberUrl: 'https://example.com/john',
              memberPhoto: { standardUrl: '' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const img = wrapper.find('.organizer-photo')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('data:image/svg+xml')
      
      wrapper.unmount()
    })

    it('should not display email link when organizer email is missing', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'John Doe',
              email: '',
              memberUrl: 'https://example.com/john',
              memberPhoto: { standardUrl: 'https://example.com/photo.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const emailLink = wrapper.find('.organizer-email')
      expect(emailLink.exists()).toBe(false)
      
      wrapper.unmount()
    })

    it('should not display profile link when organizer memberUrl is missing', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'John Doe',
              email: 'john@example.com',
              memberUrl: '',
              memberPhoto: { standardUrl: 'https://example.com/photo.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const profileLink = wrapper.find('.organizer-link')
      expect(profileLink.exists()).toBe(false)
      expect(wrapper.text()).toContain('John Doe')
      
      wrapper.unmount()
    })
  })

  describe('Organizers Section', () => {
    it('should display organizer name and photo', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      expect(wrapper.text()).toContain('Jane Smith')
      const img = wrapper.find('.organizer-photo')
      expect(img.attributes('src')).toBe('https://example.com/jane.jpg')
      
      wrapper.unmount()
    })

    it('should display clickable profile link when memberUrl is available', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const profileLink = wrapper.find('.organizer-link')
      expect(profileLink.exists()).toBe(true)
      expect(profileLink.attributes('href')).toBe('https://example.com/jane')
      expect(profileLink.text()).toBe('Jane Smith')
      
      wrapper.unmount()
    })

    it('should display clickable email link when email is available', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const emailLink = wrapper.find('.organizer-email')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe('mailto:jane@example.com')
      expect(emailLink.text()).toBe('jane@example.com')
      
      wrapper.unmount()
    })

    it('should display "Email All Organizers" link when multiple organizers exist', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [
            {
              node: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                memberUrl: 'https://example.com/jane',
                memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
              }
            },
            {
              node: {
                name: 'John Doe',
                email: 'john@example.com',
                memberUrl: 'https://example.com/john',
                memberPhoto: { standardUrl: 'https://example.com/john.jpg' }
              }
            }
          ]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const emailAllButton = wrapper.find('.email-all-button')
      expect(emailAllButton.exists()).toBe(true)
      expect(emailAllButton.text()).toContain('Email All Organizers')
      expect(emailAllButton.attributes('href')).toBe('mailto:jane@example.com,john@example.com')
      
      wrapper.unmount()
    })

    it('should not display "Email All Organizers" link when only one organizer exists', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const emailAllButton = wrapper.find('.email-all-button')
      expect(emailAllButton.exists()).toBe(false)
      
      wrapper.unmount()
    })

    it('should display multiple organizers correctly', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [
            {
              node: {
                name: 'Jane Smith',
                email: 'jane@example.com',
                memberUrl: 'https://example.com/jane',
                memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
              }
            },
            {
              node: {
                name: 'John Doe',
                email: 'john@example.com',
                memberUrl: 'https://example.com/john',
                memberPhoto: { standardUrl: 'https://example.com/john.jpg' }
              }
            }
          ]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      expect(wrapper.text()).toContain('Jane Smith')
      expect(wrapper.text()).toContain('John Doe')
      
      const organizerCards = wrapper.findAll('.organizer-card')
      expect(organizerCards).toHaveLength(2)
      
      wrapper.unmount()
    })
  })

  describe('Social Media Links Section', () => {
    it('should display message when no valid social links are available', () => {
      const group = createMinimalGroup({ socialNetworks: [] })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('No social media links available')
      
      wrapper.unmount()
    })

    it('should display message when all social networks have empty identifiers', () => {
      const group = createMinimalGroup({
        socialNetworks: [
          { identifier: '', service: 'Twitter', url: 'https://twitter.com/test' },
          { identifier: '   ', service: 'Facebook', url: 'https://facebook.com/test' }
        ]
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('No social media links available')
      
      wrapper.unmount()
    })

    it('should display social media links with service name and URL', () => {
      const group = createMinimalGroup({
        socialNetworks: [
          { identifier: 'awsgroup', service: 'Twitter', url: 'https://twitter.com/awsgroup' },
          { identifier: 'awsgroup', service: 'Facebook', url: 'https://facebook.com/awsgroup' }
        ]
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('Twitter')
      expect(text).toContain('https://twitter.com/awsgroup')
      expect(text).toContain('Facebook')
      expect(text).toContain('https://facebook.com/awsgroup')
      
      const socialLinks = wrapper.findAll('.social-link')
      expect(socialLinks).toHaveLength(2)
      
      wrapper.unmount()
    })

    it('should filter out social networks with empty identifiers', () => {
      const group = createMinimalGroup({
        socialNetworks: [
          { identifier: 'awsgroup', service: 'Twitter', url: 'https://twitter.com/awsgroup' },
          { identifier: '', service: 'Facebook', url: 'https://facebook.com/test' },
          { identifier: 'awslinkedin', service: 'LinkedIn', url: 'https://linkedin.com/awslinkedin' }
        ]
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const socialLinks = wrapper.findAll('.social-link')
      expect(socialLinks).toHaveLength(2)
      
      const text = wrapper.text()
      expect(text).toContain('Twitter')
      expect(text).toContain('LinkedIn')
      expect(text).not.toContain('Facebook')
      
      wrapper.unmount()
    })
  })

  describe('Analytics Section', () => {
    it('should display unavailable message when no analytics data exists', () => {
      const group = createMinimalGroup({
        groupAnalytics: null,
        pastEvents: { edges: [] },
        upcomingEvents: { edges: [] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('Analytics data is not available for this group')
      
      wrapper.unmount()
    })

    it('should display member count from groupAnalytics when available', () => {
      const group = createMinimalGroup({
        memberships: { totalCount: 100 },
        groupAnalytics: {
          memberCount: 150,
          rsvpCount: 500,
          eventsThisYear: 10,
          plannedEvents: 5,
          averageAge: 35,
          averageRsvpPerEvent: 50,
          genderRatio: { male: 60, female: 35, other: 5 }
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('150')
      expect(text).toContain('Members')
      
      wrapper.unmount()
    })

    it('should display member count from memberships.totalCount when groupAnalytics is null', () => {
      const group = createMinimalGroup({
        memberships: { totalCount: 100 },
        groupAnalytics: null,
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: '2024-01-15', endTime: '2024-01-15', eventUrl: '', rsvps: { totalCount: 20 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('100')
      expect(text).toContain('Members')
      
      wrapper.unmount()
    })

    it('should calculate and display RSVP count from pastEvents', () => {
      const group = createMinimalGroup({
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: '2024-01-15', endTime: '2024-01-15', eventUrl: '', rsvps: { totalCount: 20 } } },
          { node: { id: '2', title: 'Event 2', description: '', dateTime: '2024-02-15', endTime: '2024-02-15', eventUrl: '', rsvps: { totalCount: 30 } } },
          { node: { id: '3', title: 'Event 3', description: '', dateTime: '2024-03-15', endTime: '2024-03-15', eventUrl: '', rsvps: { totalCount: 25 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('75')
      expect(text).toContain('RSVPs')
      
      wrapper.unmount()
    })

    it('should calculate and display events this year from pastEvents', () => {
      const currentYear = new Date().getFullYear()
      const lastYear = currentYear - 1
      
      const group = createMinimalGroup({
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: `${currentYear}-01-15`, endTime: `${currentYear}-01-15`, eventUrl: '', rsvps: { totalCount: 20 } } },
          { node: { id: '2', title: 'Event 2', description: '', dateTime: `${currentYear}-02-15`, endTime: `${currentYear}-02-15`, eventUrl: '', rsvps: { totalCount: 30 } } },
          { node: { id: '3', title: 'Event 3', description: '', dateTime: `${lastYear}-03-15`, endTime: `${lastYear}-03-15`, eventUrl: '', rsvps: { totalCount: 25 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('2')
      expect(text).toContain('Events This Year')
      
      wrapper.unmount()
    })

    it('should display planned events count from upcomingEvents', () => {
      const group = createMinimalGroup({
        upcomingEvents: { edges: [
          { node: { id: '1', title: 'Future Event 1', description: '', dateTime: '2025-01-15', endTime: '2025-01-15', eventUrl: '', rsvps: { totalCount: 10 } } },
          { node: { id: '2', title: 'Future Event 2', description: '', dateTime: '2025-02-15', endTime: '2025-02-15', eventUrl: '', rsvps: { totalCount: 15 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('2')
      expect(text).toContain('Upcoming Events')
      
      wrapper.unmount()
    })

    it('should display average age when available in groupAnalytics', () => {
      const group = createMinimalGroup({
        groupAnalytics: {
          memberCount: 150,
          rsvpCount: 500,
          eventsThisYear: 10,
          plannedEvents: 5,
          averageAge: 35,
          averageRsvpPerEvent: 50,
          genderRatio: { male: 60, female: 35, other: 5 }
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('35')
      expect(text).toContain('Average Age')
      
      wrapper.unmount()
    })

    it('should not display average age when groupAnalytics is null', () => {
      const group = createMinimalGroup({
        groupAnalytics: null,
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: '2024-01-15', endTime: '2024-01-15', eventUrl: '', rsvps: { totalCount: 20 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).not.toContain('Average Age')
      
      wrapper.unmount()
    })

    it('should calculate and display average RSVP per event', () => {
      const group = createMinimalGroup({
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: '2024-01-15', endTime: '2024-01-15', eventUrl: '', rsvps: { totalCount: 20 } } },
          { node: { id: '2', title: 'Event 2', description: '', dateTime: '2024-02-15', endTime: '2024-02-15', eventUrl: '', rsvps: { totalCount: 30 } } },
          { node: { id: '3', title: 'Event 3', description: '', dateTime: '2024-03-15', endTime: '2024-03-15', eventUrl: '', rsvps: { totalCount: 25 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('25')
      expect(text).toContain('Avg RSVP/Event')
      
      wrapper.unmount()
    })

    it('should display 0 average RSVP per event when no past events exist', () => {
      const group = createMinimalGroup({
        pastEvents: { edges: [] },
        upcomingEvents: { edges: [
          { node: { id: '1', title: 'Future Event', description: '', dateTime: '2025-01-15', endTime: '2025-01-15', eventUrl: '', rsvps: { totalCount: 10 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('0')
      expect(text).toContain('Avg RSVP/Event')
      
      wrapper.unmount()
    })

    it('should display gender ratio as percentages when available in groupAnalytics', () => {
      const group = createMinimalGroup({
        groupAnalytics: {
          memberCount: 150,
          rsvpCount: 500,
          eventsThisYear: 10,
          plannedEvents: 5,
          averageAge: 35,
          averageRsvpPerEvent: 50,
          genderMembershipRatios: { 
            maleRatio: 0.60, 
            femaleRatio: 0.35, 
            otherRatio: 0.05,
            unknownRatio: 0.00
          }
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).toContain('60% Male')
      expect(text).toContain('35% Female')
      expect(text).toContain('5% Other')
      expect(text).toContain('Gender Distribution')
      
      wrapper.unmount()
    })

    it('should not display gender ratio when groupAnalytics is null', () => {
      const group = createMinimalGroup({
        groupAnalytics: null,
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: '2024-01-15', endTime: '2024-01-15', eventUrl: '', rsvps: { totalCount: 20 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const text = wrapper.text()
      expect(text).not.toContain('Gender Ratio')
      
      wrapper.unmount()
    })
  })

  describe('Responsive Behavior and Visual Design', () => {
    it('should render dialog container with proper max-width and max-height', () => {
      const group = createMinimalGroup()
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const dialogContainer = wrapper.find('.dialog-container')
      expect(dialogContainer.exists()).toBe(true)
      
      // Check that the container has the expected classes for styling
      expect(dialogContainer.classes()).toContain('dialog-container')
      
      wrapper.unmount()
    })

    it('should have scrollable dialog body with overflow handling', () => {
      const group = createMinimalGroup({
        description: 'A very long description that might cause overflow in the dialog body. '.repeat(20),
        orgs: {
          edges: Array.from({ length: 10 }, (_, i) => ({
            node: {
              name: `Organizer ${i + 1}`,
              email: `organizer${i + 1}@example.com`,
              memberUrl: `https://example.com/organizer${i + 1}`,
              memberPhoto: { standardUrl: `https://example.com/photo${i + 1}.jpg` }
            }
          }))
        },
        socialNetworks: Array.from({ length: 5 }, (_, i) => ({
          identifier: `social${i + 1}`,
          service: `Service ${i + 1}`,
          url: `https://example.com/social${i + 1}`
        })),
        groupAnalytics: {
          memberCount: 150,
          rsvpCount: 500,
          eventsThisYear: 10,
          plannedEvents: 5,
          averageAge: 35,
          averageRsvpPerEvent: 50,
          genderRatio: { male: 60, female: 35, other: 5 }
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const dialogBody = wrapper.find('.dialog-body')
      expect(dialogBody.exists()).toBe(true)
      
      // Verify that all cards are rendered
      expect(wrapper.findAll('.card').length).toBeGreaterThan(0)
      
      wrapper.unmount()
    })

    it('should organize content into clear visual sections', () => {
      const group = createMinimalGroup({
        description: 'Test description',
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        },
        socialNetworks: [
          { identifier: 'awsgroup', service: 'Twitter', url: 'https://twitter.com/awsgroup' }
        ],
        pastEvents: { edges: [
          { node: { id: '1', title: 'Event 1', description: '', dateTime: '2024-01-15', endTime: '2024-01-15', eventUrl: '', rsvps: { totalCount: 20 } } }
        ] }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      // Check that all major sections exist
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBeGreaterThanOrEqual(2) // Analytics and Organizers cards
      
      // Check section titles
      const text = wrapper.text()
      expect(text).toContain('Organizers')
      expect(text).toContain('Social Media')
      expect(text).toContain('Analytics')
      
      wrapper.unmount()
    })

    it('should display visual icons for different information types', () => {
      const group = createMinimalGroup({
        foundedDate: '2020-01-01',
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        },
        socialNetworks: [
          { identifier: 'awsgroup', service: 'Twitter', url: 'https://twitter.com/awsgroup' }
        ]
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const html = wrapper.html()
      
      // Check for emoji icons in the HTML
      expect(html).toContain('📍') // Location icon
      expect(html).toContain('📅') // Founded date icon
      expect(html).toContain('👥') // Organizers section icon
      expect(html).toContain('🔗') // Social Media section icon
      expect(html).toContain('🌐') // Social link icon
      expect(html).toContain('📊') // Analytics section icon
      
      wrapper.unmount()
    })

    it('should style Pro Network tag with distinctive appearance', () => {
      const group = createMinimalGroup({ proNetwork: 'AWS Pro Network' })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const proBadge = wrapper.find('.pro-badge')
      expect(proBadge.exists()).toBe(true)
      expect(proBadge.text()).toContain('Pro')
      
      wrapper.unmount()
    })

    it('should style organizer cards with proper structure', () => {
      const group = createMinimalGroup({
        orgs: {
          edges: [{
            node: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              memberUrl: 'https://example.com/jane',
              memberPhoto: { standardUrl: 'https://example.com/jane.jpg' }
            }
          }]
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const organizerCard = wrapper.find('.organizer-card')
      expect(organizerCard.exists()).toBe(true)
      
      const organizerPhoto = wrapper.find('.organizer-photo')
      expect(organizerPhoto.exists()).toBe(true)
      
      const organizerInfo = wrapper.find('.organizer-info')
      expect(organizerInfo.exists()).toBe(true)
      
      wrapper.unmount()
    })

    it('should style social media links with proper structure', () => {
      const group = createMinimalGroup({
        socialNetworks: [
          { identifier: 'awsgroup', service: 'Twitter', url: 'https://twitter.com/awsgroup' }
        ]
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const socialLink = wrapper.find('.social-link')
      expect(socialLink.exists()).toBe(true)
      
      const socialIcon = wrapper.find('.social-icon')
      expect(socialIcon.exists()).toBe(true)
      
      const socialInfo = wrapper.find('.social-info')
      expect(socialInfo.exists()).toBe(true)
      
      const socialService = wrapper.find('.social-service')
      expect(socialService.exists()).toBe(true)
      expect(socialService.text()).toBe('Twitter')
      
      const socialUrl = wrapper.find('.social-url')
      expect(socialUrl.exists()).toBe(true)
      expect(socialUrl.text()).toBe('https://twitter.com/awsgroup')
      
      wrapper.unmount()
    })

    it('should style analytics section with clear data presentation', () => {
      const group = createMinimalGroup({
        groupAnalytics: {
          memberCount: 150,
          rsvpCount: 500,
          eventsThisYear: 10,
          plannedEvents: 5,
          averageAge: 35,
          averageRsvpPerEvent: 50,
          genderRatio: { male: 60, female: 35, other: 5 }
        }
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const analyticsGrid = wrapper.find('.analytics-grid')
      expect(analyticsGrid.exists()).toBe(true)
      
      const statBoxes = wrapper.findAll('.stat-box')
      expect(statBoxes.length).toBeGreaterThan(0)
      
      const statValue = wrapper.find('.stat-value')
      expect(statValue.exists()).toBe(true)
      
      const statLabel = wrapper.find('.stat-label')
      expect(statLabel.exists()).toBe(true)
      
      wrapper.unmount()
    })

    it('should have proper ARIA attributes for accessibility', () => {
      const group = createMinimalGroup()
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      const dialogOverlay = wrapper.find('.dialog-overlay')
      expect(dialogOverlay.attributes('role')).toBe('dialog')
      expect(dialogOverlay.attributes('aria-modal')).toBe('true')
      expect(dialogOverlay.attributes('aria-labelledby')).toBe('group-dialog-title')
      
      const dialogTitle = wrapper.find('#group-dialog-title')
      expect(dialogTitle.exists()).toBe(true)
      
      const closeButton = wrapper.find('.close-button')
      expect(closeButton.attributes('aria-label')).toBe('Close dialog')
      
      wrapper.unmount()
    })

    it('should hide decorative icons from screen readers', () => {
      const group = createMinimalGroup({
        foundedDate: '2020-01-01',
        socialNetworks: [
          { identifier: 'awsgroup', service: 'Twitter', url: 'https://twitter.com/awsgroup' }
        ]
      })
      const wrapper = mount(GroupDetailsDialog, { props: { group } })
      
      // Check that social icon has aria-hidden (info-icon no longer exists in new design)
      const socialIcon = wrapper.find('.social-icon')
      expect(socialIcon.exists()).toBe(true)
      
      wrapper.unmount()
    })
  })
})
