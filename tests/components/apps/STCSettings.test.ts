import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import STCSettings from '~/components/apps/STCSettings.vue'
import { ref, computed } from 'vue'

// Mock data
const mockSettings = ref({
  enabled: false,
  cursor: { style: 'arrow' as const, color: '#FF0000' },
  showRemoteCursors: true,
  showCursorLabels: true
})

const mockConnectionState = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')
const mockCurrentSession = ref(null)
const mockRemoteUsersList = ref([])
const mockAvailableSessions = ref([])

const mockConnect = vi.fn()
const mockDisconnect = vi.fn()
const mockCreateSession = vi.fn()
const mockJoinSession = vi.fn()
const mockLeaveSession = vi.fn()
const mockRefreshSessionList = vi.fn()
const mockUpdateSettings = vi.fn()

vi.mock('~/composables/useSharedDesktop', () => ({
  useSharedDesktop: () => ({
    connectionState: mockConnectionState,
    settings: mockSettings,
    currentSession: mockCurrentSession,
    isConnected: computed(() => mockConnectionState.value === 'connected'),
    isInSession: computed(() => mockCurrentSession.value !== null),
    isHost: computed(() => false),
    remoteUsersList: mockRemoteUsersList,
    availableSessions: mockAvailableSessions,
    userCount: computed(() => mockCurrentSession.value ? 1 : 0),
    connect: mockConnect,
    disconnect: mockDisconnect,
    createSession: mockCreateSession,
    joinSession: mockJoinSession,
    leaveSession: mockLeaveSession,
    refreshSessionList: mockRefreshSessionList,
    updateSettings: mockUpdateSettings
  })
}))

describe('STCSettings.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSettings.value = {
      enabled: false,
      cursor: { style: 'arrow', color: '#FF0000' },
      showRemoteCursors: true,
      showCursorLabels: true
    }
    mockConnectionState.value = 'disconnected'
    mockCurrentSession.value = null
    mockRemoteUsersList.value = []
    mockAvailableSessions.value = []
  })

  it('renders correctly', () => {
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings').exists()).toBe(true)
  })

  it('displays the title', () => {
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__title').text()).toBe('Share the Computer')
  })

  it('shows disabled state when STC is not enabled', () => {
    const wrapper = mount(STCSettings)
    const button = wrapper.find('.mac-button')
    expect(button.text()).toBe('Disabled')
  })

  it('shows enabled state when STC is enabled', () => {
    mockSettings.value.enabled = true
    const wrapper = mount(STCSettings)
    const buttons = wrapper.findAll('.mac-button')
    const enableButton = buttons.find(b => b.text() === 'Enabled')
    expect(enableButton).toBeDefined()
  })

  it('toggles STC mode when button is clicked', async () => {
    const wrapper = mount(STCSettings)
    const button = wrapper.find('.mac-button')
    await button.trigger('click')
    expect(mockUpdateSettings).toHaveBeenCalledWith({ enabled: true })
  })

  it('displays connection status', () => {
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__status').text()).toBe('Disconnected')
  })

  it('displays connecting status', () => {
    mockConnectionState.value = 'connecting'
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__status').text()).toBe('Connecting...')
  })

  it('displays connected status', () => {
    mockConnectionState.value = 'connected'
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__status').text()).toBe('Connected')
  })

  it('displays cursor style options', () => {
    const wrapper = mount(STCSettings)
    const styleButtons = wrapper.findAll('.stc-settings__cursor-style-btn')
    expect(styleButtons.length).toBe(4) // arrow, hand, crosshair, pointer
  })

  it('displays cursor color options', () => {
    const wrapper = mount(STCSettings)
    const colorButtons = wrapper.findAll('.stc-settings__color-btn')
    expect(colorButtons.length).toBe(8) // 8 predefined colors
  })

  it('updates cursor style when clicked', async () => {
    const wrapper = mount(STCSettings)
    const styleButtons = wrapper.findAll('.stc-settings__cursor-style-btn')
    await styleButtons[1].trigger('click') // Click 'Hand' button
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      cursor: expect.objectContaining({ style: 'hand' })
    })
  })

  it('updates cursor color when clicked', async () => {
    const wrapper = mount(STCSettings)
    const colorButtons = wrapper.findAll('.stc-settings__color-btn')
    await colorButtons[1].trigger('click') // Click second color
    expect(mockUpdateSettings).toHaveBeenCalledWith({
      cursor: expect.objectContaining({ color: expect.any(String) })
    })
  })

  it('displays show remote cursors checkbox', () => {
    const wrapper = mount(STCSettings)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(1)
  })

  it('toggles show remote cursors setting', async () => {
    const wrapper = mount(STCSettings)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].trigger('change')
    expect(mockUpdateSettings).toHaveBeenCalledWith({ showRemoteCursors: false })
  })

  it('shows session section when connected', () => {
    mockConnectionState.value = 'connected'
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__section-title').exists()).toBe(true)
  })

  it('shows create session input when connected but not in session', () => {
    mockConnectionState.value = 'connected'
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__create-session').exists()).toBe(true)
  })

  it('calls createSession when create button is clicked', async () => {
    mockConnectionState.value = 'connected'
    const wrapper = mount(STCSettings)
    const createButton = wrapper.findAll('.mac-button').find(b => b.text() === 'Create')
    await createButton?.trigger('click')
    expect(mockCreateSession).toHaveBeenCalled()
  })

  it('shows available sessions when there are sessions', () => {
    mockConnectionState.value = 'connected'
    mockAvailableSessions.value = [
      { id: 'session-1', name: 'Test Session', hostId: 'host-1', userCount: 2 }
    ] as any
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.mac-select').exists()).toBe(true)
  })

  it('shows no sessions message when no sessions available', () => {
    mockConnectionState.value = 'connected'
    mockAvailableSessions.value = []
    const wrapper = mount(STCSettings)
    expect(wrapper.find('.stc-settings__no-sessions').exists()).toBe(true)
  })

  it('shows leave session button when in session', () => {
    mockConnectionState.value = 'connected'
    mockCurrentSession.value = {
      id: 'session-1',
      name: 'Test Session',
      hostId: 'host-1',
      users: [],
      isActive: true,
      createdAt: Date.now()
    } as any
    const wrapper = mount(STCSettings)
    const leaveButton = wrapper.findAll('.mac-button').find(b => b.text() === 'Leave Session')
    expect(leaveButton).toBeDefined()
  })

  it('calls leaveSession when leave button is clicked', async () => {
    mockConnectionState.value = 'connected'
    mockCurrentSession.value = {
      id: 'session-1',
      name: 'Test Session',
      hostId: 'host-1',
      users: [],
      isActive: true,
      createdAt: Date.now()
    } as any
    const wrapper = mount(STCSettings)
    const leaveButton = wrapper.findAll('.mac-button').find(b => b.text() === 'Leave Session')
    await leaveButton?.trigger('click')
    expect(mockLeaveSession).toHaveBeenCalled()
  })
})
