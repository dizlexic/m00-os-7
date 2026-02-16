import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import UsersSettings from '~/components/apps/UsersSettings.vue'

// Mock the useUser composable
vi.mock('~/composables/useUser')

// Mock the useAlert composable
vi.mock('~/composables/useAlert', () => ({
  useAlert: () => ({
    showAlert: vi.fn(),
    showConfirm: vi.fn().mockResolvedValue(true),
    showPrompt: vi.fn()
  })
}))

import { useUser } from '~/composables/useUser'
import { useAlert } from '~/composables/useAlert'

// Store mock functions for assertions
const mockFetchUsers = vi.fn().mockResolvedValue(undefined)
const mockRegister = vi.fn().mockResolvedValue(true)
const mockRemoveUser = vi.fn().mockResolvedValue(true)

const mockUsers = ref([
  { id: 1, username: 'admin' },
  { id: 2, username: 'testuser' },
  { id: 3, username: 'guest' }
])

const mockCurrentUser = ref({ id: 1, username: 'admin' })

describe('UsersSettings.vue', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetchUsers.mockClear()
    mockRegister.mockClear()
    mockRemoveUser.mockClear()

    vi.mocked(useUser).mockReturnValue({
      users: mockUsers as any,
      currentUser: mockCurrentUser as any,
      isAuthenticated: ref(true) as any,
      fetchUsers: mockFetchUsers,
      register: mockRegister,
      removeUser: mockRemoveUser,
      login: vi.fn(),
      loginAsGuest: vi.fn(),
      logout: vi.fn(),
      init: vi.fn()
    })
  })

  describe('User List Display', () => {
    it('renders the Users & Groups title', () => {
      const wrapper = mount(UsersSettings)
      expect(wrapper.text()).toContain('Users')
    })

    it('fetches users on mount', async () => {
      mount(UsersSettings)
      await flushPromises()
      expect(mockFetchUsers).toHaveBeenCalled()
    })

    it('displays list of users', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      expect(wrapper.text()).toContain('admin')
      expect(wrapper.text()).toContain('testuser')
      expect(wrapper.text()).toContain('guest')
    })

    it('shows user count', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      expect(wrapper.text()).toContain('3')
    })
  })

  describe('User Creation', () => {
    it('shows create user form with username and password fields', () => {
      const wrapper = mount(UsersSettings)

      expect(wrapper.find('input[placeholder*="Username"]').exists() ||
             wrapper.find('input#new-username').exists()).toBe(true)
      expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    })

    it('calls register when create user button is clicked with valid input', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      // Find and fill the username input
      const usernameInput = wrapper.find('input#new-username')
      await usernameInput.setValue('newuser')

      // Find and fill the password input
      const passwordInput = wrapper.find('input#new-password')
      await passwordInput.setValue('password123')

      // Click create button
      const createButton = wrapper.find('[data-testid="create-user-btn"]')
      await createButton.trigger('click')
      await flushPromises()

      expect(mockRegister).toHaveBeenCalledWith('newuser', 'password123')
    })

    it('shows error when trying to create user with empty username', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      // Leave username empty, fill password
      const passwordInput = wrapper.find('input#new-password')
      await passwordInput.setValue('password123')

      // Click create button
      const createButton = wrapper.find('[data-testid="create-user-btn"]')
      await createButton.trigger('click')
      await flushPromises()

      expect(mockRegister).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Username is required')
    })

    it('shows error when trying to create user with empty password', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      // Fill username, leave password empty
      const usernameInput = wrapper.find('input#new-username')
      await usernameInput.setValue('newuser')

      // Click create button
      const createButton = wrapper.find('[data-testid="create-user-btn"]')
      await createButton.trigger('click')
      await flushPromises()

      expect(mockRegister).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Password is required')
    })

    it('clears form after successful user creation', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      // Fill the form
      const usernameInput = wrapper.find('input#new-username')
      const passwordInput = wrapper.find('input#new-password')
      await usernameInput.setValue('newuser')
      await passwordInput.setValue('password123')

      // Click create button
      const createButton = wrapper.find('[data-testid="create-user-btn"]')
      await createButton.trigger('click')
      await flushPromises()

      // Form should be cleared
      expect((usernameInput.element as HTMLInputElement).value).toBe('')
      expect((passwordInput.element as HTMLInputElement).value).toBe('')
    })

    it('refreshes user list after successful creation', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      mockFetchUsers.mockClear()

      // Fill the form
      await wrapper.find('input#new-username').setValue('newuser')
      await wrapper.find('input#new-password').setValue('password123')

      // Click create button
      await wrapper.find('[data-testid="create-user-btn"]').trigger('click')
      await flushPromises()

      // fetchUsers should be called again to refresh the list
      expect(mockFetchUsers).toHaveBeenCalled()
    })
  })

  describe('User Deletion', () => {
    it('shows delete button for each user except current user', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      const deleteButtons = wrapper.findAll('[data-testid^="delete-user-"]')
      // Should have delete buttons for testuser and guest, but not admin (current user)
      expect(deleteButtons.length).toBe(2)
    })

    it('does not show delete button for current user', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      // Current user is admin (id: 1)
      const adminDeleteButton = wrapper.find('[data-testid="delete-user-1"]')
      expect(adminDeleteButton.exists()).toBe(false)
    })

    it('calls removeUser when delete button is clicked', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      // Click delete button for testuser (id: 2)
      const deleteButton = wrapper.find('[data-testid="delete-user-2"]')
      await deleteButton.trigger('click')
      await flushPromises()

      expect(mockRemoveUser).toHaveBeenCalledWith(2)
    })

    it('refreshes user list after successful deletion', async () => {
      const wrapper = mount(UsersSettings)
      await flushPromises()

      mockFetchUsers.mockClear()

      // Click delete button for testuser (id: 2)
      const deleteButton = wrapper.find('[data-testid="delete-user-2"]')
      await deleteButton.trigger('click')
      await flushPromises()

      expect(mockFetchUsers).toHaveBeenCalled()
    })
  })

  describe('Empty State', () => {
    it('shows message when no users exist', async () => {
      vi.mocked(useUser).mockReturnValue({
        users: ref([]) as any,
        currentUser: ref(null) as any,
        isAuthenticated: ref(true) as any,
        fetchUsers: mockFetchUsers,
        register: mockRegister,
        removeUser: mockRemoveUser,
        login: vi.fn(),
        loginAsGuest: vi.fn(),
        logout: vi.fn(),
        init: vi.fn()
      })

      const wrapper = mount(UsersSettings)
      await flushPromises()

      expect(wrapper.text()).toContain('No users')
    })
  })
})
