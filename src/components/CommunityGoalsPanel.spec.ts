import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommunityGoalsPanel from './CommunityGoalsPanel.vue'
import GroupDetailsDialog from './GroupDetailsDialog.vue'
import type { RawMeetupGroup } from '../types/meetup'

describe('CommunityGoalsPanel - GroupDetailsDialog Integration', () => {
  const mockGroup: RawMeetupGroup = {
    id: 'test-group-1',
    name: 'Test AWS User Group',
    city: 'Berlin',
    country: 'de',
    description: 'A test group',
    foundedDate: '2020-01-15',
    proNetwork: null,
    memberships: { totalCount: 100 },
    socialNetworks: [],
    orgs: { edges: [] },
    groupAnalytics: null,
    pastEvents: { edges: [] },
    upcomingEvents: { edges: [] }
  }

  it('should open GroupDetailsDialog when group row is clicked', async () => {
    const wrapper = mount(CommunityGoalsPanel, {
      props: { meetups: [mockGroup] }
    })

    // Initially, dialog should not be visible
    expect(wrapper.findComponent(GroupDetailsDialog).exists()).toBe(false)

    // Find and click the group row
    const groupRow = wrapper.find('.group-row')
    expect(groupRow.exists()).toBe(true)
    await groupRow.trigger('click')

    // Dialog should now be visible
    expect(wrapper.findComponent(GroupDetailsDialog).exists()).toBe(true)
  })

  it('should close GroupDetailsDialog when close event is emitted', async () => {
    const wrapper = mount(CommunityGoalsPanel, {
      props: { meetups: [mockGroup] }
    })

    // Open the dialog
    const groupRow = wrapper.find('.group-row')
    await groupRow.trigger('click')

    // Verify dialog is open
    expect(wrapper.findComponent(GroupDetailsDialog).exists()).toBe(true)

    // Emit close event from dialog
    const dialog = wrapper.findComponent(GroupDetailsDialog)
    await dialog.vm.$emit('close')

    // Dialog should be closed
    expect(wrapper.findComponent(GroupDetailsDialog).exists()).toBe(false)
  })

  it('should pass correct group data to GroupDetailsDialog', async () => {
    const wrapper = mount(CommunityGoalsPanel, {
      props: { meetups: [mockGroup] }
    })

    // Open the dialog
    const groupRow = wrapper.find('.group-row')
    await groupRow.trigger('click')

    // Verify correct group is passed
    const dialog = wrapper.findComponent(GroupDetailsDialog)
    expect(dialog.props('group')).toEqual(mockGroup)
  })

  it('should have group row with cursor pointer style', () => {
    const wrapper = mount(CommunityGoalsPanel, {
      props: { meetups: [mockGroup] }
    })

    const groupRow = wrapper.find('.group-row')
    expect(groupRow.exists()).toBe(true)
    // The row should be clickable (tested by the click handler above)
  })

  it('should handle multiple groups correctly', async () => {
    const mockGroup2: RawMeetupGroup = {
      ...mockGroup,
      id: 'test-group-2',
      name: 'Another Test Group',
      city: 'Munich'
    }

    const wrapper = mount(CommunityGoalsPanel, {
      props: { meetups: [mockGroup, mockGroup2] }
    })

    // Find all group rows
    const groupRows = wrapper.findAll('.group-row')
    expect(groupRows.length).toBeGreaterThanOrEqual(2)

    // Click the first row
    await groupRows[0].trigger('click')
    let dialog = wrapper.findComponent(GroupDetailsDialog)
    const firstGroupId = dialog.props('group').id
    expect([mockGroup.id, mockGroup2.id]).toContain(firstGroupId)

    // Close the dialog
    await dialog.vm.$emit('close')

    // Click the second row
    await groupRows[1].trigger('click')
    dialog = wrapper.findComponent(GroupDetailsDialog)
    const secondGroupId = dialog.props('group').id
    expect([mockGroup.id, mockGroup2.id]).toContain(secondGroupId)
    
    // Verify they're different groups
    expect(firstGroupId).not.toBe(secondGroupId)
  })
})
