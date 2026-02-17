import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Messenger from '~/components/apps/Messenger.vue'
import { ref } from 'vue'

// Mock composables
const mockUpdateWindow = vi.fn()
vi.mock('~/composables/useWindowManager', () => ({
  useWindowManager: () => ({
    updateWindow: mockUpdateWindow,
    activeWindow: { value: { id: 'win1' } }
  })
}))

const mockShowContextMenu = vi.fn()
vi.mock('~/composables/useDesktop', () => ({
  useDesktop: () => ({
    showContextMenu: mockShowContextMenu
  })
}))

vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    currentUser: { value: { id: 'test-user', username: 'TestUser' } }
  })
}))

const mockConnect = vi.fn()
const mockSendMessage = vi.fn()
const mockUpdateStatus = vi.fn()
const mockCreateRoom = vi.fn()
const mockJoinRoom = vi.fn()
const mockLeaveRoom = vi.fn()
const mockRefreshRooms = vi.fn()
const mockRefreshUsers = vi.fn()
const mockSendFriendRequest = vi.fn()

vi.mock('~/composables/useChat', () => ({
  useChat: () => ({
    isConnected: ref(true),
    messages: ref([]),
    friends: ref([{ id: 'friend1', username: 'Friend1', status: 'online' }]),
    rooms: ref([{ id: 'room1', name: 'Room 1', members: [], ownerId: 'other' }]),
    blocked: ref([]),
    muted: ref([]),
    allUsers: ref({}),
    status: ref('online'),
    customStatus: ref(''),
    activeChatId: ref('lobby'),
    connect: mockConnect,
    sendMessage: mockSendMessage,
    updateStatus: mockUpdateStatus,
    createRoom: mockCreateRoom,
    joinRoom: mockJoinRoom,
    leaveRoom: mockLeaveRoom,
    refreshRooms: mockRefreshRooms,
    refreshUsers: mockRefreshUsers,
    sendFriendRequest: mockSendFriendRequest
  })
}))

describe('Messenger.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates window with menus on mount', () => {
    mount(Messenger, {
      props: { windowId: 'win1' }
    })

    expect(mockUpdateWindow).toHaveBeenCalledWith('win1', expect.objectContaining({
      appMenu: expect.any(Array),
      menus: expect.any(Array)
    }))
  })

  it('shows context menu when right-clicking on a room', async () => {
    const wrapper = mount(Messenger, {
      props: { windowId: 'win1' }
    })

    const roomItem = wrapper.find('.messenger__room-item')
    await roomItem.trigger('contextmenu')

    expect(mockShowContextMenu).toHaveBeenCalled()
  })

  it('shows context menu when right-clicking on a friend', async () => {
    const wrapper = mount(Messenger, {
      props: { windowId: 'win1' }
    })

    const buddyItem = wrapper.findComponent({ name: 'BuddyList' })
    buddyItem.vm.$emit('user-contextmenu', { clientX: 100, clientY: 100, preventDefault: vi.fn() } as any, 'friend1', 'Friend1')

    expect(mockShowContextMenu).toHaveBeenCalledWith(
      { x: 100, y: 100 },
      expect.arrayContaining([
        expect.objectContaining({ label: 'Message Friend1' }),
        expect.objectContaining({ label: 'Block User' }),
        expect.objectContaining({ label: 'Mute User' })
      ])
    )
  })
})
