import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerPeer,
  unregisterPeer,
  createSession,
  createChatRoom,
  joinSession,
  joinRoom,
  leaveSession,
  leaveRoom,
  GLOBAL_STC_SESSION_ID,
  GLOBAL_CHAT_ROOM_ID,
  initGlobals,
  getSTCSession,
  getChatRoom
} from '../../../server/utils/stc'

// Mock Peer from h3
const mockPeer = {
  id: 'peer-1',
  send: () => {},
  close: () => {},
} as any

describe('STC and Chat separation', () => {
  beforeEach(() => {
    // Clear state if possible or just use unique IDs
    initGlobals()
  })

  it('should join global session and global room on register', () => {
    const peer = registerPeer('peer-1', mockPeer, 'user1', { style: 'arrow', color: '#000' }, 'user-1')

    expect(peer.stcSessionId).toBe(GLOBAL_STC_SESSION_ID)
    expect(peer.chatRoomIds.has(GLOBAL_CHAT_ROOM_ID)).toBe(true)

    const globalSession = getSTCSession(GLOBAL_STC_SESSION_ID)
    expect(globalSession?.users.has('user-1')).toBe(true)

    const globalRoom = getChatRoom(GLOBAL_CHAT_ROOM_ID)
    expect(globalRoom?.members.has('user-1')).toBe(true)
  })

  it('should separate STC session and Chat room creation', () => {
    const peer = registerPeer('peer-2', { ...mockPeer, id: 'peer-2' }, 'user2', { style: 'arrow', color: '#000' }, 'user-2')

    // Create a new STC session
    const session = createSession('peer-2', 'New STC Session')
    expect(session).toBeDefined()
    expect(peer.stcSessionId).toBe(session?.id)
    // Should still be in global chat room
    expect(peer.chatRoomIds.has(GLOBAL_CHAT_ROOM_ID)).toBe(true)

    // Create a new Chat room
    const room = createChatRoom('peer-2', 'New Chat Room')
    expect(room).toBeDefined()
    expect(peer.chatRoomIds.has(room!.id)).toBe(true)
    // Should still be in the NEW STC session
    expect(peer.stcSessionId).toBe(session?.id)
  })

  it('should return to global session when leaving a private session but stay in chat rooms', () => {
    const peer = registerPeer('peer-3', { ...mockPeer, id: 'peer-3' }, 'user3', { style: 'arrow', color: '#000' }, 'user-3')

    const session = createSession('peer-3', 'Private Session')
    const room = createChatRoom('peer-3', 'Chat Room')

    expect(peer.stcSessionId).toBe(session?.id)
    expect(peer.chatRoomIds.has(room!.id)).toBe(true)

    leaveSession('peer-3')

    // Should return to global session
    expect(peer.stcSessionId).toBe(GLOBAL_STC_SESSION_ID)
    // Should still be in the chat room
    expect(peer.chatRoomIds.has(room!.id)).toBe(true)
    expect(peer.chatRoomIds.has(GLOBAL_CHAT_ROOM_ID)).toBe(true)
  })

  it('should stay in STC session when leaving a chat room', () => {
    const peer = registerPeer('peer-4', { ...mockPeer, id: 'peer-4' }, 'user4', { style: 'arrow', color: '#000' }, 'user-4')

    const session = createSession('peer-4', 'STC Session')
    const room = createChatRoom('peer-4', 'Chat Room')

    expect(peer.stcSessionId).toBe(session?.id)
    expect(peer.chatRoomIds.has(room!.id)).toBe(true)

    leaveRoom('peer-4', room!.id)

    // Should no longer be in the chat room
    expect(peer.chatRoomIds.has(room!.id)).toBe(false)
    // Should STILL be in the STC session
    expect(peer.stcSessionId).toBe(session?.id)
  })
})
