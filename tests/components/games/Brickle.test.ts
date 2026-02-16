import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Brickle from '~/components/games/Brickle.vue'

const mockUpdateWindow = vi.fn()
const mockShowContextMenu = vi.fn()

vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    updateWindow: mockUpdateWindow
  })
}))

vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    showContextMenu: mockShowContextMenu
  })
}))

describe('Brickle.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock requestAnimationFrame and cancelAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    // Mock HTMLCanvasElement.getContext
    const mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      rect: vi.fn(),
      strokeRect: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      getContext: vi.fn(),
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any)
  })

  it('renders correctly in idle state', () => {
    const wrapper = mount(Brickle)
    expect(wrapper.find('.brickle').exists()).toBe(true)
    expect(wrapper.find('.brickle__message h2').text()).toBe('BRICKLE')
    expect(wrapper.find('.mac-button').text()).toBe('Start Game')
  })

  it('starts the game when start button is clicked', async () => {
    const wrapper = mount(Brickle)
    const startButton = wrapper.find('.mac-button')
    await startButton.trigger('click')

    // Should no longer show the overlay with start button
    // Actually it might show nothing or playing state doesn't have overlay
    expect(wrapper.find('.brickle__overlay').exists()).toBe(false)
  })

  it('displays score and lives', () => {
    const wrapper = mount(Brickle)
    expect(wrapper.find('.brickle__info').text()).toContain('Score: 0')
    expect(wrapper.find('.brickle__info').text()).toContain('Lives: 3')
  })

  it('pauses when isActive prop changes to false', async () => {
    const wrapper = mount(Brickle, {
      props: {
        isActive: true
      }
    })

    // Start game
    await wrapper.find('.mac-button').trigger('click')
    expect(wrapper.find('.brickle__overlay').exists()).toBe(false)

    // Deactivate window
    await wrapper.setProps({ isActive: false })

    // Should show paused overlay
    expect(wrapper.find('.brickle__message h2').text()).toBe('PAUSED')
  })

  it('pauses and resumes when P key is pressed', async () => {
    const wrapper = mount(Brickle, {
      props: {
        isActive: true
      }
    })

    // Start game
    await wrapper.find('.mac-button').trigger('click')
    expect(wrapper.find('.brickle__overlay').exists()).toBe(false)

    // Press P
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.brickle__message h2').text()).toBe('PAUSED')

    // Press P again
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.brickle__overlay').exists()).toBe(false)
  })

  it('pauses when Escape key is pressed', async () => {
    const wrapper = mount(Brickle, {
      props: {
        isActive: true
      }
    })

    // Start game
    await wrapper.find('.mac-button').trigger('click')

    // Press Escape
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.brickle__message h2').text()).toBe('PAUSED')
  })

  it('updates window menus when active', () => {
    mount(Brickle, {
      props: {
        isActive: true,
        windowId: 'test-window'
      }
    })

    expect(mockUpdateWindow).toHaveBeenCalledWith('test-window', expect.objectContaining({
      menus: expect.arrayContaining([
        expect.objectContaining({ id: 'game' })
      ])
    }))
  })

  it('shows context menu on right click', async () => {
    const wrapper = mount(Brickle)
    await wrapper.trigger('contextmenu')

    expect(mockShowContextMenu).toHaveBeenCalled()
  })
})
