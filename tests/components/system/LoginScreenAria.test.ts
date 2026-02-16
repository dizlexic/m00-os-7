import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import LoginScreen from '~/components/system/LoginScreen.vue'

vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    login: vi.fn(),
    loginAsGuest: vi.fn(),
    isAuthenticated: ref(false),
    logout: vi.fn(),
    register: vi.fn(),
    currentUser: ref(null),
    users: ref([{ id: 1, username: 'Alice' }]),
    fetchUsers: vi.fn(),
    removeUser: vi.fn(),
    init: vi.fn()
  })
}))

vi.mock('~/composables/useFileSystem', () => ({
  useFileSystem: () => ({
    fetchFilesFromServer: vi.fn()
  })
}))

vi.mock('~/composables/useSettings', () => ({
  useSettings: () => ({
    fetchSettingsFromServer: vi.fn(),
    fetchSystemSettings: vi.fn(),
    systemSettings: ref({ allowGuestLogin: true })
  })
}))

describe('LoginScreen.vue ARIA', () => {
  it('has ARIA roles and labels', async () => {
    const wrapper = mount(LoginScreen)
    await flushPromises()

    const dialog = wrapper.find('.login-dialog')
    expect(dialog.attributes('role')).toBe('dialog')
    expect(dialog.attributes('aria-labelledby')).toBeDefined()

    const welcomeHeading = wrapper.find('.welcome-text')
    expect(welcomeHeading.attributes('id')).toBe(dialog.attributes('aria-labelledby'))

    const userList = wrapper.find('.user-list')
    expect(userList.attributes('role')).toBe('listbox')
    expect(userList.attributes('aria-labelledby')).toBe('user-list-label')

    const userItem = wrapper.find('.user-item')
    expect(userItem.attributes('role')).toBe('option')
  })
})
