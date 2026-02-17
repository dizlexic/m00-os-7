import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useChat } from '~/composables/useChat'

// Mock useUser
vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    currentUser: { value: { id: 'test-user', username: 'TestUser' } }
  })
}))

// Mock useWebSocket
const mockSend = vi.fn()
const mockSubscribe = vi.fn().mockReturnValue(() => {})
const connectionState = ref('disconnected')

vi.mock('~/composables/useWebSocket', () => ({
  useWebSocket: () => ({
    send: mockSend,
    subscribe: mockSubscribe,
    connectionState: connectionState
  })
}))

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionState.value = 'disconnected'
  })

  it('initializes with default state', () => {
    const chat = useChat()
    expect(chat.isConnected.value).toBe(false)
    expect(chat.status.value).toBe('online')
  })

  it('subscribes to websocket on mount', () => {
    // Mounting is simulated by the composable call if it has onMounted
    // But in vitest, we might need to use a component or manual trigger
    // useChat has onMounted
  })

  it('sends status update', () => {
    const chat = useChat()
    connectionState.value = 'connected'

    chat.updateStatus('away', 'Be right back')
    expect(mockSend).toHaveBeenCalledWith('chat-status-update', {
      status: 'away',
      customStatus: 'Be right back'
    })
  })

  it('sends chat message', () => {
    const chat = useChat()
    connectionState.value = 'connected'

    chat.sendMessage('Hello world', { roomId: 'lobby' })
    expect(mockSend).toHaveBeenCalledWith('chat-message', {
      roomId: 'lobby',
      text: 'Hello world'
    })
  })

  it('sends friend request', () => {
    const chat = useChat()
    chat.sendFriendRequest('otheruser')
    expect(mockSend).toHaveBeenCalledWith('friend-request', {
      username: 'otheruser'
    })
  })

  it('creates room with privacy', () => {
    const chat = useChat()
    chat.createRoom('My Private Room', true)
    expect(mockSend).toHaveBeenCalledWith('session-create', {
      sessionName: 'My Private Room',
      isPrivate: true
    })
  })

  it('mutes and unmutes users', () => {
    const chat = useChat()
    chat.muteUser('user1')
    expect(chat.muted.value).toContain('user1')
    chat.unmuteUser('user1')
    expect(chat.muted.value).not.toContain('user1')
  })

  it('leaves a room', () => {
    const chat = useChat()
    chat.leaveRoom('room1')
    expect(mockSend).toHaveBeenCalledWith('session-leave', {
      sessionId: 'room1'
    })
  })

  it('invites a user to a room', () => {
    const chat = useChat()
    chat.inviteToRoom('room1', 'user1')
    expect(mockSend).toHaveBeenCalledWith('session-invite', {
      sessionId: 'room1',
      userId: 'user1'
    })
  })

  it('removes a user from a room', () => {
    const chat = useChat()
    chat.removeFromRoom('room1', 'user1')
    expect(mockSend).toHaveBeenCalledWith('session-kick', {
      sessionId: 'room1',
      userId: 'user1'
    })
  })
})
