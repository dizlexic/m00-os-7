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
  createSession,
  joinSession,
  leaveSession,
  getSession,
  getAllSessions,
  updateUserPosition,
  updateUserCursor,
  broadcastToSession,
  sendToPeer,
  getSessionUsersArray
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
  | 'session-list'
  | 'session-state'
  | 'session-users'
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
  const cookieHeader = peer.headers?.cookie || peer.headers?.Cookie || ''
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
    if (connectedPeer && connectedPeer.sessionId) {
      const result = leaveSession(peer.id)
      if (result) {
        // Notify other users in the session
        broadcastToSession(
          result.session.id,
          createMessage('user-left', { user: result.user }, connectedPeer.userId)
        )
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
        const newPeer = registerPeer(peer.id, peer, payload.username, cursor)

        sendToPeer(peer.id, createMessage('connect', {
          userId: newPeer.userId,
          username: newPeer.username,
          cursor: newPeer.cursor
        }, newPeer.userId))

        console.log(`[STC] User connected: ${newPeer.username} (${newPeer.userId})`)
        break
      }

      case 'session-create': {
        if (!connectedPeer) {
          sendError(peer.id, 'NOT_CONNECTED', 'Must connect first')
          return
        }

        const payload = message.payload as { sessionName: string }
        const sessionName = payload?.sessionName || `${connectedPeer.username}'s Desktop`

        const session = createSession(peer.id, sessionName)
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
            createdAt: session.createdAt
          }
        }, connectedPeer.userId))

        console.log(`[STC] Session created: ${session.name} (${session.id}) by ${connectedPeer.username}`)
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
        if (!connectedPeer || !connectedPeer.sessionId) {
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
          createdAt: s.createdAt
        }))

        sendToPeer(peer.id, createMessage('session-list', { sessions }))
        break
      }

      case 'cursor-move': {
        if (!connectedPeer || !connectedPeer.sessionId) return

        const payload = message.payload as { position: Position }
        if (!payload?.position) return

        const user = updateUserPosition(peer.id, payload.position)
        if (user) {
          broadcastToSession(
            connectedPeer.sessionId,
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
        if (user && connectedPeer.sessionId) {
          broadcastToSession(
            connectedPeer.sessionId,
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
        if (!connectedPeer || !connectedPeer.sessionId) return

        // Broadcast the action to all other users in the session
        broadcastToSession(
          connectedPeer.sessionId,
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
