/**
 * WebSocket Route Handler for STC (Share the Computer) Mode
 *
 * Handles real-time communication between users sharing the same desktop.
 */

import { defineWebSocketHandler } from 'h3'
import { parse } from 'cookie-es'
import {
  registerPeer,
  unregisterPeer,
  getPeer,
  getAllPeers,
  getSTCSession,
  getChatRoom,
  createSession,
  createChatRoom,
  joinSession,
  joinRoom,
  leaveSession,
  leaveRoom,
  getAllSessions,
  getAllRooms,
  updateUserPosition,
  updateUserCursor,
  broadcastToSession,
  broadcastToRoom,
  broadcastToAll,
  sendToPeer,
  getSessionUsersArray,
  getRoomMembersArray,
  getPeerByUserId,
  getPeerByUsername,
  GLOBAL_STC_SESSION_ID,
  GLOBAL_CHAT_ROOM_ID
} from '../utils/stc'
import type { CursorConfig, Position } from '../utils/stc'

/** Message types */
type MessageType =
  | 'connect'
  | 'disconnect'
  | 'user-joined'
  | 'user-left'
  | 'cursor-move'
  | 'cursor-config-update'
  | 'icon-select'
  | 'icon-deselect'
  | 'icon-move'
  | 'icon-rename'
  | 'icon-open'
  | 'window-open'
  | 'window-close'
  | 'window-move'
  | 'window-resize'
  | 'window-focus'
  | 'window-minimize'
  | 'window-maximize'
  | 'key-press'
  | 'text-input'
  | 'session-create'
  | 'session-join'
  | 'session-leave'
  | 'session-state'
  | 'session-users'
  | 'room-create'
  | 'room-join'
  | 'room-leave'
  | 'room-list'
  | 'room-state'
  | 'chat-message'
  | 'chat-private-message'
  | 'chat-status-update'
  | 'chat-buddy-update'
  | 'friend-request'
  | 'user-list'
  | 'error'

/** Base message structure */
interface Message {
  type: MessageType
  payload?: unknown
  userId?: string
  timestamp?: number
}

/** Create a message object */
function createMessage(type: MessageType, payload: unknown, userId?: string): Message {
  return {
    type,
    payload,
    userId,
    timestamp: Date.now()
  }
}

/** Send error message to peer */
function sendError(peerId: string, code: string, message: string): void {
  sendToPeer(peerId, createMessage('error', { code, message }))
}

/** Get user ID from peer headers */
function getUserIdFromPeer(peer: any): string | undefined {
  const headers = peer.headers || peer.request?.headers || {}
  let cookieHeader = ''

  if (typeof (headers as any).get === 'function') {
    cookieHeader = (headers as any).get('cookie') || (headers as any).get('Cookie') || ''
  } else {
    cookieHeader = (headers as any).cookie || (headers as any).Cookie || ''
  }

  if (!cookieHeader) return undefined

  try {
    const cookies = parse(Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader)
    return cookies.user_id
  } catch (e) {
    console.error('[STC] Failed to parse cookies:', e)
    return undefined
  }
}

export default defineWebSocketHandler({
  open(peer) {
    console.log(`[STC] WebSocket connection opened: ${peer.id}`)

    const userId = getUserIdFromPeer(peer)

    if (!userId) {
      console.warn(`[STC] Unauthenticated connection attempt from ${peer.id}. Headers:`, JSON.stringify(peer.headers))
      // We don't close yet, wait for 'connect' message to verify
    } else {
      console.log(`[STC] Authenticated connection from ${peer.id}, userId: ${userId}`)
    }
  },

  close(peer) {
    console.log(`[STC] WebSocket connection closed: ${peer.id}`)

    const connectedPeer = getPeer(peer.id)
    if (connectedPeer) {
      if (connectedPeer.stcSessionId) {
        const result = leaveSession(peer.id)
        if (result) {
          // Notify other users in the session
          broadcastToSession(
            result.session.id,
            createMessage('user-left', { user: result.user }, connectedPeer.userId)
          )
        }
      }

      for (const roomId of connectedPeer.chatRoomIds) {
        const room = leaveRoom(peer.id, roomId)
        if (room) {
          broadcastToRoom(
            roomId,
            createMessage('user-left', { user: { id: connectedPeer.userId, username: connectedPeer.username } }, connectedPeer.userId)
          )
        }
      }
    }

    unregisterPeer(peer.id)
  },

  error(peer, error) {
    console.error(`[STC] WebSocket error for ${peer.id}:`, error)
  },

  message(peer, rawMessage) {
    let message: Message

    try {
      const data = typeof rawMessage === 'string' ? rawMessage : rawMessage.text()
      message = JSON.parse(data as string) as Message
    } catch {
      console.error(`[STC] Failed to parse message from ${peer.id}`)
      sendError(peer.id, 'PARSE_ERROR', 'Invalid message format')
      return
    }

    const connectedPeer = getPeer(peer.id)

    switch (message.type) {
      case 'connect': {
        const payload = message.payload as { username: string; cursor: CursorConfig }

        // Verify authentication
        const authenticatedUserId = getUserIdFromPeer(peer)

        if (!authenticatedUserId) {
          console.warn(`[STC] Connect failed: Unauthenticated peer ${peer.id}`)
          sendError(peer.id, 'UNAUTHENTICATED', 'You must be logged in to connect')
          peer.close(1008, 'Unauthenticated')
          return
        }

        if (!payload?.username) {
          sendError(peer.id, 'INVALID_PAYLOAD', 'Username is required')
          return
        }

        const cursor: CursorConfig = payload.cursor || { style: 'arrow', color: '#FF0000' }
        const newPeer = registerPeer(peer.id, peer, payload.username, cursor, authenticatedUserId)

        sendToPeer(peer.id, createMessage('connect', {
          userId: newPeer.userId,
          username: newPeer.username,
          cursor: newPeer.cursor
        }, newPeer.userId))

        // Notify session users that a new user joined and send current state
        const globalSession = getSTCSession(GLOBAL_STC_SESSION_ID)
        if (globalSession) {
          const sessionStateMessage = createMessage('session-state', {
            session: {
              id: globalSession.id,
              name: globalSession.name,
              hostId: globalSession.hostId,
              users: getSessionUsersArray(globalSession.id),
              isActive: globalSession.isActive,
              createdAt: globalSession.createdAt
            }
          }, newPeer.userId)
          
          broadcastToSession(GLOBAL_STC_SESSION_ID, sessionStateMessage)
        }

        // Notify room members that a new user joined
        broadcastToRoom(GLOBAL_CHAT_ROOM_ID, createMessage('user-joined', {
          user: {
            id: newPeer.userId,
            username: newPeer.username,
            position: { x: 0, y: 0 },
            cursor: newPeer.cursor,
            isActive: true,
            lastActivity: Date.now()
          }
        }, newPeer.userId))

        // Send room state to the joining peer
        const globalRoom = getChatRoom(GLOBAL_CHAT_ROOM_ID)
        if (globalRoom) {
          sendToPeer(peer.id, createMessage('room-state', {
            room: {
              id: globalRoom.id,
              name: globalRoom.name,
              ownerId: globalRoom.ownerId,
              members: Array.from(globalRoom.members),
              memberNames: getRoomMembersArray(globalRoom.id).reduce((acc: any, m) => {
                acc[m.id] = m.username
                return acc
              }, {}),
              isActive: globalRoom.isActive,
              createdAt: globalRoom.createdAt
            }
          }, newPeer.userId))
        }

        console.log(`[STC] User connected: ${newPeer.username} (${newPeer.userId})`)
        break
      }

      case 'chat-message': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { roomId?: string; text: string }
        if (!payload?.text) {
          sendError(peer.id, 'INVALID_PAYLOAD', 'Message text is required')
          return
        }

        if (payload.roomId) {
          if (payload.roomId === 'lobby') {
            // Global lobby message
            broadcastToAll(
              createMessage('chat-message', {
                roomId: 'lobby',
                text: payload.text,
                senderId: connectedPeer.userId,
                senderName: connectedPeer.username
              }, connectedPeer.userId)
            )
          } else {
            // Room message
            broadcastToRoom(
              payload.roomId,
              createMessage('chat-message', {
                roomId: payload.roomId,
                text: payload.text,
                senderId: connectedPeer.userId,
                senderName: connectedPeer.username
              }, connectedPeer.userId)
            )
          }
        }
        break
      }

      case 'chat-private-message': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { recipientId: string; text: string }
        if (!payload?.recipientId || !payload?.text) {
          sendError(peer.id, 'INVALID_PAYLOAD', 'Recipient ID and text are required')
          return
        }

        const recipientPeer = getPeerByUserId(payload.recipientId)
        if (recipientPeer) {
          sendToPeer(recipientPeer.peerId, createMessage('chat-private-message', {
            text: payload.text,
            senderId: connectedPeer.userId,
            senderName: connectedPeer.username,
            recipientId: payload.recipientId
          }, connectedPeer.userId))

          // Also send back to sender for confirmation/sync
          sendToPeer(peer.id, createMessage('chat-private-message', {
            recipientId: payload.recipientId,
            text: payload.text,
            senderId: connectedPeer.userId,
            senderName: connectedPeer.username
          }, connectedPeer.userId))
        } else {
          sendError(peer.id, 'USER_NOT_FOUND', 'Recipient not found or offline')
        }
        break
      }

      case 'chat-status-update': {
        if (!connectedPeer) return

        const payload = message.payload as { status: string; customStatus?: string }
        // Broadcast status update to everyone
        broadcastToAll(
          createMessage('chat-status-update', {
            userId: connectedPeer.userId,
            status: payload.status,
            customStatus: payload.customStatus
          }, connectedPeer.userId)
        )
        break
      }

      case 'chat-buddy-update': {
        // Handle friends/block logic - for now just broadcast update
        break
      }

      case 'friend-request': {
        if (!connectedPeer) return
        const payload = message.payload as { username: string }
        if (!payload.username) return

        // Find the peer with this username
        const targetPeer = getPeerByUsername(payload.username)
        if (targetPeer) {
          sendToPeer(targetPeer.peer.id, createMessage('friend-request', {
            senderId: connectedPeer.userId,
            senderName: connectedPeer.username
          }))
        } else {
          sendError(peer.id, 'USER_NOT_FOUND', `User ${payload.username} not found`)
        }
        break
      }

      case 'room-create': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { roomName: string; isPrivate?: boolean }
        if (!payload?.roomName) {
          sendError(peer.id, 'INVALID_PAYLOAD', 'Room name is required')
          return
        }

        const isPrivate = payload.isPrivate || false
        const room = createChatRoom(peer.id, payload.roomName, isPrivate)

        if (!room) {
          sendError(peer.id, 'ROOM_CREATE_FAILED', 'Failed to create room')
          return
        }

        // Send room state to the creator
        sendToPeer(peer.id, createMessage('room-state', {
          room: {
            id: room.id,
            name: room.name,
            ownerId: room.ownerId,
            members: Array.from(room.members),
            memberNames: getRoomMembersArray(room.id).reduce((acc: any, m) => {
              acc[m.id] = m.username
              return acc
            }, {}),
            isActive: room.isActive,
            isPrivate: room.isPrivate,
            createdAt: room.createdAt
          }
        }, connectedPeer.userId))

        console.log(`[STC] Room created: ${room.name} (${room.id}) by ${connectedPeer.username}`)
        break
      }

      case 'room-join': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { roomId: string }
        if (!payload?.roomId) {
          sendError(peer.id, 'INVALID_PAYLOAD', 'Room ID is required')
          return
        }

        const room = joinRoom(peer.id, payload.roomId)
        if (!room) {
          sendError(peer.id, 'ROOM_JOIN_FAILED', 'Failed to join room')
          return
        }

        // Send room state to the joining user
        sendToPeer(peer.id, createMessage('room-state', {
          room: {
            id: room.id,
            name: room.name,
            ownerId: room.ownerId,
            members: Array.from(room.members),
            memberNames: getRoomMembersArray(room.id).reduce((acc: any, m) => {
              acc[m.id] = m.username
              return acc
            }, {}),
            isActive: room.isActive,
            isPrivate: room.isPrivate,
            createdAt: room.createdAt
          }
        }, connectedPeer.userId))

        // Notify other users in the room
        broadcastToRoom(
          room.id,
          createMessage('user-joined', {
            user: {
              id: connectedPeer.userId,
              username: connectedPeer.username,
              position: { x: 0, y: 0 }, // Default position
              cursor: connectedPeer.cursor,
              isActive: true,
              lastActivity: Date.now()
            }
          }, connectedPeer.userId),
          peer.id
        )

        console.log(`[STC] User ${connectedPeer.username} joined room ${room.name}`)
        break
      }

      case 'room-leave': {
        const payload = message.payload as { roomId: string }
        if (!connectedPeer || !payload?.roomId) return

        const room = leaveRoom(peer.id, payload.roomId)
        if (room) {
          // Notify other users
          broadcastToRoom(
            payload.roomId,
            createMessage('user-left', {
              user: { id: connectedPeer.userId, username: connectedPeer.username }
            }, connectedPeer.userId)
          )

          sendToPeer(peer.id, createMessage('room-leave', { success: true, roomId: payload.roomId }, connectedPeer.userId))
          console.log(`[STC] User ${connectedPeer.username} left room ${room.name}`)
        }
        break
      }

      case 'room-list': {
        const rooms = getAllRooms().map(r => ({
          id: r.id,
          name: r.name,
          ownerId: r.ownerId,
          memberCount: r.members.size,
          isPrivate: r.isPrivate,
          createdAt: r.createdAt
        }))

        sendToPeer(peer.id, createMessage('room-list', { rooms }))
        break
      }

      case 'session-create': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { sessionName: string, isPrivate?: boolean }
        const sessionName = payload?.sessionName || `${connectedPeer.username}'s Desktop`
        const isPrivate = payload?.isPrivate || false

        const session = createSession(peer.id, sessionName, isPrivate)
        if (!session) {
          sendError(peer.id, 'SESSION_CREATE_FAILED', 'Failed to create session')
          return
        }

        sendToPeer(peer.id, createMessage('session-state', {
          session: {
            id: session.id,
            name: session.name,
            hostId: session.hostId,
            users: getSessionUsersArray(session.id),
            isActive: session.isActive,
            isPrivate: session.isPrivate,
            createdAt: session.createdAt
          }
        }, connectedPeer.userId))

        console.log(`[STC] Session created: ${session.name} (${session.id}) by ${connectedPeer.username} (Private: ${isPrivate})`)
        break
      }

      case 'session-join': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { sessionId: string }
        if (!payload?.sessionId) {
          sendError(peer.id, 'INVALID_PAYLOAD', 'Session ID is required')
          return
        }

        const session = joinSession(peer.id, payload.sessionId)
        if (!session) {
          sendError(peer.id, 'SESSION_JOIN_FAILED', 'Failed to join session')
          return
        }

        const user = session.users.get(connectedPeer.userId)

        // Send session state to the joining user
        sendToPeer(peer.id, createMessage('session-state', {
          session: {
            id: session.id,
            name: session.name,
            hostId: session.hostId,
            users: getSessionUsersArray(session.id),
            isActive: session.isActive,
            isPrivate: session.isPrivate,
            createdAt: session.createdAt
          }
        }, connectedPeer.userId))

        // Notify other users
        broadcastToSession(
          session.id,
          createMessage('user-joined', { user }, connectedPeer.userId),
          peer.id
        )

        console.log(`[STC] User ${connectedPeer.username} joined session ${session.name}`)
        break
      }

      case 'session-leave': {
        if (!connectedPeer || !connectedPeer.stcSessionId) {
          sendError(peer.id, 'NOT_IN_SESSION', 'Not in a session')
          return
        }

        const result = leaveSession(peer.id)
        if (result) {
          // Notify other users
          broadcastToSession(
            result.session.id,
            createMessage('user-left', { user: result.user }, connectedPeer.userId)
          )

          sendToPeer(peer.id, createMessage('session-leave', { success: true }, connectedPeer.userId))
          console.log(`[STC] User ${connectedPeer.username} left session ${result.session.name}`)
        }
        break
      }

      case 'session-list': {
        const sessions = getAllSessions().map(s => ({
          id: s.id,
          name: s.name,
          hostId: s.hostId,
          userCount: s.users.size,
          isPrivate: s.isPrivate,
          createdAt: s.createdAt
        }))

        sendToPeer(peer.id, createMessage('session-list', { sessions }))
        break
      }

      case 'user-list': {
        const users = getAllPeers().map(p => ({
          id: p.userId,
          username: p.username
        }))
        sendToPeer(peer.id, createMessage('user-list', { users }))
        break
      }

      case 'cursor-move': {
        if (!connectedPeer || !connectedPeer.stcSessionId) return

        const payload = message.payload as { position: Position }
        if (!payload?.position) return

        const user = updateUserPosition(peer.id, payload.position)
        if (user) {
          broadcastToSession(
            connectedPeer.stcSessionId,
            createMessage('cursor-move', {
              userId: connectedPeer.userId,
              position: payload.position
            }, connectedPeer.userId),
            peer.id
          )
        }
        break
      }

      case 'cursor-config-update': {
        if (!connectedPeer) return

        const payload = message.payload as { cursor: CursorConfig }
        if (!payload?.cursor) return

        const user = updateUserCursor(peer.id, payload.cursor)
        if (user && connectedPeer.stcSessionId) {
          broadcastToSession(
            connectedPeer.stcSessionId,
            createMessage('cursor-config-update', {
              userId: connectedPeer.userId,
              cursor: payload.cursor
            }, connectedPeer.userId),
            peer.id
          )
        }
        break
      }

      // Desktop interaction messages - broadcast to session
      case 'icon-select':
      case 'icon-deselect':
      case 'icon-move':
      case 'icon-rename':
      case 'icon-open':
      case 'window-open':
      case 'window-close':
      case 'window-move':
      case 'window-resize':
      case 'window-focus':
      case 'window-minimize':
      case 'window-maximize':
      case 'key-press':
      case 'text-input': {
        if (!connectedPeer || !connectedPeer.stcSessionId) return

        // Broadcast the action to all other users in the session
        broadcastToSession(
          connectedPeer.stcSessionId,
          createMessage(message.type, message.payload, connectedPeer.userId),
          peer.id
        )
        break
      }

      default:
        console.warn(`[STC] Unknown message type: ${message.type}`)
    }
  }
})
