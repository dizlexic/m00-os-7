import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LoginScreen from '~/components/system/LoginScreen.vue'

// Mock the useUser composable
vi.mock('~/composables/useUser')

import { useUser } from '~/composables/useUser'

describe('LoginScreen.vue', () => {
  beforeEach(() => {
    vi.mocked(useUser).mockReturnValue({
      login: vi.fn().mockResolvedValue(true),
      loginAsGuest: vi.fn().mockResolvedValue(true),
      users: ref([{ id: 1, username: 'Admin' }]) as any,
      fetchUsers: vi.fn().mockResolvedValue(undefined),
      isAuthenticated: ref(false) as any,
      logout: vi.fn(),
      register: vi.fn().mockResolvedValue(true),
      removeUser: vi.fn().mockResolvedValue(true),
      currentUser: ref(null) as any
    })
  })

  it('renders user selection initially', () => {
    const wrapper = mount(LoginScreen)
    expect(wrapper.text()).toContain('Select User')
    expect(wrapper.text()).toContain('Admin')
    expect(wrapper.text()).toContain('Guest')
  });

  it('shows password entry after selecting a user', async () => {
    const wrapper = mount(LoginScreen)

    // Find the Admin user item and click it
    const userItems = wrapper.findAll('.user-item')
    const adminItem = userItems.find(i => i.text().includes('Admin'))
    await adminItem?.trigger('click')

    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Password:')
  });

  it('calls login on button click', async () => {
    const wrapper = mount(LoginScreen)

    // Select Admin
    const userItems = wrapper.findAll('.user-item')
    const adminItem = userItems.find(i => i.text().includes('Admin'))
    await adminItem?.trigger('click')

    // Enter password
    await wrapper.find('input[type="password"]').setValue('password123')

    // Click login
    const loginButton = wrapper.find('button.mac-button--default')
    await loginButton.trigger('click')
  });

  it('shows error if passwords do not match during registration', async () => {
    const wrapper = mount(LoginScreen)

    // Select New User
    const newUserItem = wrapper.findAll('.user-item').find(i => i.text().includes('New User'))
    await newUserItem?.trigger('click')

    // Enter details
    await wrapper.find('input#username').setValue('newuser')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirm-password').setValue('password456')

    // Click register
    await wrapper.find('button.mac-button--default').trigger('click')

    expect(wrapper.text()).toContain('Passwords do not match.')
  })
});
