import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChat } from '~/composables/useChat'

// Mock useUser
vi.mock('~/composables/useUser', () => ({
  useUser: () => ({
    currentUser: { value: { id: 'test-user', username: 'TestUser' } }
  })
}))

// Mock WebSocket
const mockWs = {
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1 // OPEN
}
const WebSocketMock = vi.fn().mockImplementation(() => mockWs)
;(WebSocketMock as any).OPEN = 1
global.WebSocket = WebSocketMock as any

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', () => {
    const chat = useChat()
    expect(chat.isConnected.value).toBe(false)
    expect(chat.status.value).toBe('online')
  })

  it('connects to websocket', () => {
    const chat = useChat()
    chat.connect()
    expect(global.WebSocket).toHaveBeenCalled()
  })

  it('sends status update', () => {
    const chat = useChat()
    chat.connect()
    // Simulate open
    const onopen = (global.WebSocket as any).mock.results[0].value.onopen
    onopen()

    chat.updateStatus('away', 'Be right back')
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('chat-status-update'))
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('away'))
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('Be right back'))
  })

  it('sends chat message', () => {
    const chat = useChat()
    chat.connect()

    chat.sendMessage('Hello world', { roomId: 'lobby' })
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('chat-message'))
    expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining('Hello world'))
  })
})
