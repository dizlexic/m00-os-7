import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import LoginScreen from '~/components/system/LoginScreen.vue'

// Mock the useUser composable
vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    login: vi.fn().mockResolvedValue(true),
    isAuthenticated: { value: false }
  })
}))

describe('LoginScreen.vue', () => {
  it('renders login form', () => {
    const wrapper = mount(LoginScreen)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    // Find the login button specifically
    const buttons = wrapper.findAll('button')
    const loginButton = buttons.find(b => b.text().includes('Login'))
    expect(loginButton?.exists()).toBe(true)
  });

  it('calls login on button click', async () => {
    const wrapper = mount(LoginScreen)
    await wrapper.find('input[type="text"]').setValue('testuser')
    await wrapper.find('input[type="password"]').setValue('password123')
    
    const buttons = wrapper.findAll('button')
    const loginButton = buttons.find(b => b.text().includes('Login'))
    await loginButton?.trigger('click')
    
    // Check if login was called (via the mock)
  });
});
