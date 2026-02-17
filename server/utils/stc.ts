/**
 * Share the Computer (STC) Mode Server Utilities
 *
 * Manages STC sessions, connected users, and state synchronization.
 */

import type { Peer } from 'crossws'

/** Cursor configuration */
export interface CursorConfig {
  style: 'arrow' | 'hand' | 'crosshair' | 'pointer'
  color: string
}

/** Position coordinates */
export interface Position {
  x: number
  y: number
}

/** Remote user information */
export interface RemoteUser {
  id: string
  username: string
  position: Position
  cursor: CursorConfig
  isActive: boolean
  lastActivity: number
}

/** STC session */
export interface STCSession {
  id: string
  name: string
  hostId: string
  users: Map<string, RemoteUser>
  isActive: boolean
  isPrivate?: boolean
  createdAt: number
}

/** Connected peer with user info */
export interface ConnectedPeer {
  peer: Peer
  userId: string
  username: string
  sessionId: string | null
  cursor: CursorConfig
}

// In-memory storage for sessions and peers
const sessions = new Map<string, STCSession>()
const peers = new Map<string, ConnectedPeer>()

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `stc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Register a new peer connection
 */
export function registerPeer(
  peerId: string,
  peer: Peer,
  username: string,
  cursor: CursorConfig,
  userId?: string
): ConnectedPeer {
  const connectedPeer: ConnectedPeer = {
    peer,
    userId: userId || generateUserId(),
    username,
    sessionId: null,
    cursor
  }
  peers.set(peerId, connectedPeer)
  return connectedPeer
}

/**
 * Unregister a peer connection
 */
export function unregisterPeer(peerId: string): ConnectedPeer | undefined {
  const peer = peers.get(peerId)
  if (peer) {
    // Remove from session if in one
    if (peer.sessionId) {
      leaveSession(peerId)
    }
    peers.delete(peerId)
  }
  return peer
}

/**
 * Get a peer by ID
 */
export function getPeer(peerId: string): ConnectedPeer | undefined {
  return peers.get(peerId)
}

/**
 * Get a peer by user ID
 */
export function getPeerByUserId(userId: string): ConnectedPeer | undefined {
  for (const peer of peers.values()) {
    if (peer.userId === userId) {
      return peer
    }
  }
  return undefined
}

/**
 * Get all peers in a session
 */
export function getSessionPeers(sessionId: string): ConnectedPeer[] {
  const result: ConnectedPeer[] = []
  for (const peer of peers.values()) {
    if (peer.sessionId === sessionId) {
      result.push(peer)
    }
  }
  return result
}

/**
 * Create a new STC session
 */
export function createSession(peerId: string, sessionName: string, isPrivate: boolean = false): STCSession | null {
  const peer = peers.get(peerId)
  if (!peer) return null

  // If already in a session that is NOT the global one, leave it
  if (peer.stcSessionId && peer.stcSessionId !== GLOBAL_STC_SESSION_ID) {
    leaveSession(peerId)
  }

  const sessionId = generateSessionId()
  const session: STCSession = {
    id: sessionId,
    name: sessionName,
    hostId: peer.userId,
    users: new Map(),
    isActive: true,
    isPrivate,
    createdAt: Date.now()
  }

  // Add the host as the first user
  const hostUser: RemoteUser = {
    id: peer.userId,
    username: peer.username,
    position: { x: 0, y: 0 },
    cursor: peer.cursor,
    isActive: true,
    lastActivity: Date.now()
  }
  session.users.set(peer.userId, hostUser)

  // Update peer's session
  peer.stcSessionId = sessionId

  sessions.set(sessionId, session)
  return session
}

/**
 * Create a new Chat Room
 */
export function createChatRoom(peerId: string, roomName: string, isPrivate: boolean = false): ChatRoom | null {
  const peer = peers.get(peerId)
  if (!peer) return null

  const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const room: ChatRoom = {
    id: roomId,
    name: roomName,
    ownerId: peer.userId,
    members: new Set(),
    isActive: true,
    isPrivate,
    createdAt: Date.now()
  }

  room.members.add(peer.userId)
  peer.chatRoomIds.add(roomId)

  rooms.set(roomId, room)
  return room
}

/**
 * Join an existing session
 */
export function joinSession(peerId: string, sessionId: string): STCSession | null {
  const peer = peers.get(peerId)
  const session = sessions.get(sessionId)

  if (!peer || !session || !session.isActive) return null

  // If already in a session that is NOT the global one, leave it
  if (peer.stcSessionId && peer.stcSessionId !== sessionId && peer.stcSessionId !== GLOBAL_STC_SESSION_ID) {
    leaveSession(peerId)
  }

  // Create user entry
  const user: RemoteUser = {
    id: peer.userId,
    username: peer.username,
    position: { x: 0, y: 0 },
    cursor: peer.cursor,
    isActive: true,
    lastActivity: Date.now()
  }

  session.users.set(peer.userId, user)
  peer.stcSessionId = sessionId

  return session
}

/**
 * Join an existing room
 */
export function joinRoom(peerId: string, roomId: string): ChatRoom | null {
  const peer = peers.get(peerId)
  const room = rooms.get(roomId)

  if (!peer || !room || !room.isActive) return null

  room.members.add(peer.userId)
  peer.chatRoomIds.add(roomId)

  return room
}

/**
 * Leave a session
 */
export function leaveSession(peerId: string): { session: STCSession; user: RemoteUser } | null {
  const peer = peers.get(peerId)
  if (!peer || !peer.sessionId) return null

  const session = sessions.get(peer.sessionId)
  if (!session) return null

  const user = session.users.get(peer.userId)
  if (!user) return null

  session.users.delete(peer.userId)
  peer.sessionId = null

  // If no users left or host left, close the session
  if (session.users.size === 0 || session.hostId === peer.userId) {
    session.isActive = false
    sessions.delete(session.id)
  }

  return { session, user }
}

/**
 * Get a session by ID
 */
export function getSTCSession(sessionId: string): STCSession | undefined {
  return sessions.get(sessionId)
}

/**
 * Get all active sessions
 */
export function getAllSessions(): STCSession[] {
  return Array.from(sessions.values()).filter(s => s.isActive)
}

/**
 * Update user cursor position
 */
export function updateUserPosition(peerId: string, position: Position): RemoteUser | null {
  const peer = peers.get(peerId)
  if (!peer || !peer.sessionId) return null

  const session = sessions.get(peer.sessionId)
  if (!session) return null

  const user = session.users.get(peer.userId)
  if (!user) return null

  user.position = position
  user.lastActivity = Date.now()

  return user
}

/**
 * Update user cursor configuration
 */
export function updateUserCursor(peerId: string, cursor: CursorConfig): RemoteUser | null {
  const peer = peers.get(peerId)
  if (!peer) return null

  peer.cursor = cursor

  if (peer.sessionId) {
    const session = sessions.get(peer.sessionId)
    if (session) {
      const user = session.users.get(peer.userId)
      if (user) {
        user.cursor = cursor
        return user
      }
    }
  }

  return null
}

/**
 * Broadcast a message to all connected peers except the sender
 */
export function broadcastToAll(
  message: unknown,
  excludePeerId?: string
): void {
  const messageStr = JSON.stringify(message)

  for (const [peerId, connectedPeer] of peers) {
    // Skip the sender
    if (excludePeerId && peerId === excludePeerId) continue

    try {
      connectedPeer.peer.send(messageStr)
    } catch (error) {
      console.error(`Failed to send message to peer ${peerId}:`, error)
    }
  }
}

/**
 * Broadcast a message to all peers in a session except the sender
 */
export function broadcastToSession(
  sessionId: string,
  message: unknown,
  excludePeerId?: string
): void {
  const sessionPeers = getSessionPeers(sessionId)
  const messageStr = JSON.stringify(message)

  for (const connectedPeer of sessionPeers) {
    // Skip the sender
    if (excludePeerId && connectedPeer.peer.id === excludePeerId) continue

    try {
      connectedPeer.peer.send(messageStr)
    } catch (error) {
      console.error(`Failed to send message to peer ${connectedPeer.peer.id}:`, error)
    }
  }
}

/**
 * Send a message to a specific peer
 */
export function sendToPeer(peerId: string, message: unknown): boolean {
  const peer = peers.get(peerId)
  if (!peer) return false

  try {
    peer.peer.send(JSON.stringify(message))
    return true
  } catch (error) {
    console.error(`Failed to send message to peer ${peerId}:`, error)
    return false
  }
}

/**
 * Get session users as array (for serialization)
 */
export function getSessionUsersArray(sessionId: string): RemoteUser[] {
  const session = sessions.get(sessionId)
  if (!session) return []
  return Array.from(session.users.values())
}

/**
 * Clean up inactive sessions (call periodically)
 */
export function cleanupInactiveSessions(maxInactiveMs: number = 30 * 60 * 1000): void {
  const now = Date.now()
  for (const [sessionId, session] of sessions) {
    // Check if all users are inactive
    let allInactive = true
    for (const user of session.users.values()) {
      if (now - user.lastActivity < maxInactiveMs) {
        allInactive = false
        break
      }
    }

    if (allInactive) {
      session.isActive = false
      sessions.delete(sessionId)
    }
  }
}
