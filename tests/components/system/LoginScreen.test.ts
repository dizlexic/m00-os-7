import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import LoginScreen from '~/components/system/LoginScreen.vue'

// Mock the useUser composable
vi.mock('~/composables/useUser')

// Mock the useFileSystem composable
vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    fetchFilesFromServer: vi.fn().mockResolvedValue(undefined)
  })
}))

// Mock the useSettings composable
vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    fetchSettingsFromServer: vi.fn().mockResolvedValue(undefined)
  })
}))

import { useUser } from '~/composables/useUser'

// Store mock functions for assertions
const mockLogin = vi.fn().mockResolvedValue(true)
const mockLoginAsGuest = vi.fn()
const mockRegister = vi.fn().mockResolvedValue(true)

describe('LoginScreen.vue', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear()
    mockLoginAsGuest.mockClear()
    mockRegister.mockClear()

    vi.mocked(useUser).mockReturnValue({
      login: mockLogin,
      loginAsGuest: mockLoginAsGuest,
      isAuthenticated: ref(false) as any,
      logout: vi.fn(),
      register: mockRegister,
      currentUser: ref(null) as any,
      // Keep these for compatibility even though LoginScreen no longer uses them
      users: ref([]) as any,
      fetchUsers: vi.fn().mockResolvedValue(undefined),
      removeUser: vi.fn().mockResolvedValue(true),
      init: vi.fn().mockResolvedValue(false)
    })
  })

  it('renders login mode selection buttons', () => {
    const wrapper = mount(LoginScreen)
    expect(wrapper.text()).toContain('Login Mode')
    expect(wrapper.text()).toContain('Login')
    expect(wrapper.text()).toContain('Guest')
    expect(wrapper.text()).toContain('Register')
  })

  it('does not display list of existing users (security)', () => {
    const wrapper = mount(LoginScreen)
    // Should not show any user list or existing usernames
    expect(wrapper.find('.user-list').exists()).toBe(false)
    expect(wrapper.find('.user-item').exists()).toBe(false)
    // Should not expose any usernames
    expect(wrapper.text()).not.toContain('Admin')
  })

  it('shows username and password inputs in login mode by default', () => {
    const wrapper = mount(LoginScreen)
    expect(wrapper.find('input#username').exists()).toBe(true)
    expect(wrapper.find('input#password').exists()).toBe(true)
    expect(wrapper.text()).toContain('Username:')
    expect(wrapper.text()).toContain('Password:')
  })

  it('shows guest message when guest mode is selected', async () => {
    const wrapper = mount(LoginScreen)

    // Click Guest mode button
    const guestButton = wrapper.findAll('.mode-btn').find(btn => btn.text() === 'Guest')
    await guestButton?.trigger('click')

    expect(wrapper.text()).toContain('Continue as Guest')
    // Username and password inputs should be hidden in guest mode
    expect(wrapper.find('input#username').exists()).toBe(false)
    expect(wrapper.find('input#password').exists()).toBe(false)
  })

  it('calls login with username and password on button click', async () => {
    const wrapper = mount(LoginScreen)

    // Enter username and password
    await wrapper.find('input#username').setValue('testuser')
    await wrapper.find('input#password').setValue('password123')

    // Click login
    const loginButton = wrapper.find('button.mac-button--default')
    await loginButton.trigger('click')
    await flushPromises()

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
  })

  it('calls loginAsGuest when guest mode is selected and continue is clicked', async () => {
    const wrapper = mount(LoginScreen)

    // Click Guest mode button
    const guestButton = wrapper.findAll('.mode-btn').find(btn => btn.text() === 'Guest')
    await guestButton?.trigger('click')

    // Click continue
    const continueButton = wrapper.find('button.mac-button--default')
    await continueButton.trigger('click')
    await flushPromises()

    expect(mockLoginAsGuest).toHaveBeenCalled()
  })

  it('shows confirm password field in register mode', async () => {
    const wrapper = mount(LoginScreen)

    // Click Register mode button
    const registerButton = wrapper.findAll('.mode-btn').find(btn => btn.text() === 'Register')
    await registerButton?.trigger('click')

    expect(wrapper.find('input#confirm-password').exists()).toBe(true)
    expect(wrapper.text()).toContain('Confirm Password:')
  })

  it('shows error if passwords do not match during registration', async () => {
    const wrapper = mount(LoginScreen)

    // Click Register mode button
    const registerButton = wrapper.findAll('.mode-btn').find(btn => btn.text() === 'Register')
    await registerButton?.trigger('click')

    // Enter details with mismatched passwords
    await wrapper.find('input#username').setValue('newuser')
    await wrapper.find('input#password').setValue('password123')
    await wrapper.find('input#confirm-password').setValue('password456')

    // Click register
    await wrapper.find('button.mac-button--default').trigger('click')

    expect(wrapper.text()).toContain('Passwords do not match.')
  })

  it('shows error if username or password is empty', async () => {
    const wrapper = mount(LoginScreen)

    // Try to login without entering anything
    const loginButton = wrapper.find('button.mac-button--default')
    await loginButton.trigger('click')

    expect(wrapper.text()).toContain('Please enter both username and password.')
  })
})
