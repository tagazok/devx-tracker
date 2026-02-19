import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UploadDialog from './UploadDialog.vue'

function mountDialog(open = true) {
  return mount(UploadDialog, {
    props: { open },
    attachTo: document.body,
  })
}

describe('UploadDialog', () => {
  it('renders file inputs for tickets and meetups and a Go button when open', () => {
    const wrapper = mountDialog()

    expect(wrapper.find('#tickets-input').exists()).toBe(true)
    expect(wrapper.find('#meetups-input').exists()).toBe(true)
    expect(wrapper.find('.go-button').exists()).toBe(true)
    expect(wrapper.find('.go-button').text()).toBe('Import Data')

    wrapper.unmount()
  })

  it('does not render content when open is false', () => {
    const wrapper = mount(UploadDialog, {
      props: { open: false },
    })

    expect(wrapper.find('.dialog-overlay').exists()).toBe(false)
    expect(wrapper.find('#tickets-input').exists()).toBe(false)
  })

  it('Go button is disabled when no files are selected', () => {
    const wrapper = mountDialog()

    const goButton = wrapper.find('.go-button')
    expect((goButton.element as HTMLButtonElement).disabled).toBe(true)

    wrapper.unmount()
  })

  it('Go button is enabled when a tickets file is selected', async () => {
    const wrapper = mountDialog()

    const ticketsInput = wrapper.find('#tickets-input')
    const file = new File(['[]'], 'tickets.json', { type: 'application/json' })

    Object.defineProperty(ticketsInput.element, 'files', {
      value: [file],
      writable: false,
    })
    await ticketsInput.trigger('change')

    expect((wrapper.find('.go-button').element as HTMLButtonElement).disabled).toBe(false)

    wrapper.unmount()
  })

  it('emits close on backdrop click', async () => {
    const wrapper = mountDialog()

    await wrapper.find('.dialog-overlay').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)

    wrapper.unmount()
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = mountDialog()

    await wrapper.find('.close-button').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
    expect(wrapper.emitted('close')!.length).toBe(1)

    wrapper.unmount()
  })
})
