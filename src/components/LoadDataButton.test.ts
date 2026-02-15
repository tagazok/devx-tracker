import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LoadDataButton from './LoadDataButton.vue'

describe('LoadDataButton', () => {
  it('renders with hero variant class', () => {
    const wrapper = mount(LoadDataButton, { props: { variant: 'hero' } })
    expect(wrapper.find('button').classes()).toContain('hero')
    expect(wrapper.text()).toBe('Load data')
  })

  it('renders with compact variant class', () => {
    const wrapper = mount(LoadDataButton, { props: { variant: 'compact' } })
    expect(wrapper.find('button').classes()).toContain('compact')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(LoadDataButton, { props: { variant: 'hero' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
