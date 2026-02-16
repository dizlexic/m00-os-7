import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BuddyList from '~/components/chat/BuddyList.vue'
import type { ChatUser } from '~/types/chat'

describe('BuddyList', () => {
  const friends: ChatUser[] = [
    { id: '1', username: 'Alice', status: 'online' },
    { id: '2', username: 'Bob', status: 'away', customStatus: 'Be right back' }
  ]

  it('renders correctly with friends', () => {
    const wrapper = mount(BuddyList, {
      props: {
        friends,
        status: 'online',
        customStatus: ''
      }
    })

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('Bob')
    expect(wrapper.text()).toContain('Be right back')
  })

  it('emits select-buddy on double click', async () => {
    const wrapper = mount(BuddyList, {
      props: {
        friends,
        status: 'online',
        customStatus: ''
      }
    })

    await wrapper.find('.buddy-list__friend').trigger('dblclick')
    expect(wrapper.emitted('select-buddy')).toBeTruthy()
    expect(wrapper.emitted('select-buddy')?.[0]).toEqual(['1'])
  })

  it('shows status menu on click', async () => {
    const wrapper = mount(BuddyList, {
      props: {
        friends,
        status: 'online',
        customStatus: ''
      }
    })

    await wrapper.find('.buddy-list__current-status').trigger('click')
    expect(wrapper.find('.buddy-list__status-menu').exists()).toBe(true)
  })

  it('emits update:status when choosing a status', async () => {
    const wrapper = mount(BuddyList, {
      props: {
        friends,
        status: 'online',
        customStatus: ''
      }
    })

    await wrapper.find('.buddy-list__current-status').trigger('click')
    await wrapper.find('.buddy-list__status-option').trigger('click') // First one is Online, let's try another if possible, but first one is fine to test emission
    expect(wrapper.emitted('update:status')).toBeTruthy()
  })
})
