/**
 * Share the Computer (STC) Mode Server Utilities
 *
 * Manages STC sessions, connected users, and state synchronization.
 */

import type { Peer } from 'crossws'
import { generateUUID } from './uuid'

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

/** Chat room */
export interface ChatRoom {
  id: string
  name: string
  ownerId: string
  members: Set<string> // User IDs
  isActive: boolean
  isPrivate?: boolean
  createdAt: number
}

/** Connected peer with user info */
export interface ConnectedPeer {
  peer: Peer
  userId: string
  username: string
  stcSessionId: string | null
  chatRoomIds: Set<string>
  cursor: CursorConfig
}

// In-memory storage for sessions, rooms and peers
const sessions = new Map<string, STCSession>()
const rooms = new Map<string, ChatRoom>()
const peers = new Map<string, ConnectedPeer>()

// Global constants
export const GLOBAL_STC_SESSION_ID = 'stc-global'
export const GLOBAL_CHAT_ROOM_ID = 'lobby' // Keep 'lobby' as the ID for compatibility

/**
 * Initialize global session and room
 */
export function initGlobals() {
  if (!sessions.has(GLOBAL_STC_SESSION_ID)) {
    sessions.set(GLOBAL_STC_SESSION_ID, {
      id: GLOBAL_STC_SESSION_ID,
      name: 'Global Desktop',
      hostId: 'system',
      users: new Map(),
      isActive: true,
      createdAt: Date.now()
    })
  }

  if (!rooms.has(GLOBAL_CHAT_ROOM_ID)) {
    rooms.set(GLOBAL_CHAT_ROOM_ID, {
      id: GLOBAL_CHAT_ROOM_ID,
      name: 'System Lobby',
      ownerId: 'system',
      members: new Set(),
      isActive: true,
      createdAt: Date.now()
    })
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `stc-${generateUUID()}`
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
  return `user-${generateUUID()}`
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
  // Ensure globals are initialized
  initGlobals()

  const connectedPeer: ConnectedPeer = {
    peer,
    userId: userId || generateUserId(),
    username,
    stcSessionId: null,
    chatRoomIds: new Set(),
    cursor
  }
  peers.set(peerId, connectedPeer)

  // Join global session and room by default
  joinSession(peerId, GLOBAL_STC_SESSION_ID)
  joinRoom(peerId, GLOBAL_CHAT_ROOM_ID)

  return connectedPeer
}

/**
 * Unregister a peer connection
 */
export function unregisterPeer(peerId: string): ConnectedPeer | undefined {
  const peer = peers.get(peerId)
  if (peer) {
    // Remove from session if in one
    if (peer.stcSessionId) {
      leaveSession(peerId)
    }
    // Remove from all rooms
    for (const roomId of peer.chatRoomIds) {
      leaveRoom(peerId, roomId)
    }
    peers.delete(peerId)
  }
  return peer
}

/**
 * Get all connected peers
 */
export function getAllPeers(): ConnectedPeer[] {
  return Array.from(peers.values())
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
 * Get a peer by username
 */
export function getPeerByUsername(username: string): ConnectedPeer | undefined {
  for (const peer of peers.values()) {
    if (peer.username === username) {
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
    if (peer.stcSessionId === sessionId) {
      result.push(peer)
    }
  }
  return result
}

/**
 * Get all peers in a room
 */
export function getRoomPeers(roomId: string): ConnectedPeer[] {
  const result: ConnectedPeer[] = []
  for (const peer of peers.values()) {
    if (peer.chatRoomIds.has(roomId)) {
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

  const roomId = `room-${generateUUID()}`
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
  if (!peer || !peer.stcSessionId) return null

  const session = sessions.get(peer.stcSessionId)
  if (!session) return null

  const user = session.users.get(peer.userId)
  if (!user) return null

  session.users.delete(peer.userId)

  // If leaving a private session, go back to global session
  if (peer.stcSessionId !== GLOBAL_STC_SESSION_ID) {
    peer.stcSessionId = GLOBAL_STC_SESSION_ID
    joinSession(peerId, GLOBAL_STC_SESSION_ID)
  }

  // If no users left or host left (and not global session), close the session
  if (session.id !== GLOBAL_STC_SESSION_ID && (session.users.size === 0 || session.hostId === peer.userId)) {
    session.isActive = false
    sessions.delete(session.id)
  }

  return { session, user }
}

/**
 * Leave a room
 */
export function leaveRoom(peerId: string, roomId: string): ChatRoom | null {
  const peer = peers.get(peerId)
  const room = rooms.get(roomId)

  if (!peer || !room) return null

  room.members.delete(peer.userId)
  peer.chatRoomIds.delete(roomId)

  // If no members left and not global room, close it
  if (room.id !== GLOBAL_CHAT_ROOM_ID && room.members.size === 0) {
    room.isActive = false
    rooms.delete(room.id)
  }

  return room
}

/**
 * Get a room by ID
 */
export function getChatRoom(roomId: string): ChatRoom | undefined {
  return rooms.get(roomId)
}

/**
 * Get all active rooms
 */
export function getAllRooms(): ChatRoom[] {
  return Array.from(rooms.values()).filter(r => r.isActive)
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
  if (!peer || !peer.stcSessionId) return null

  const session = sessions.get(peer.stcSessionId)
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

  if (peer.stcSessionId) {
    const session = sessions.get(peer.stcSessionId)
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
 * Broadcast a message to all peers in a room except the sender
 */
export function broadcastToRoom(
  roomId: string,
  message: unknown,
  excludePeerId?: string
): void {
  const roomPeers = getRoomPeers(roomId)
  const messageStr = JSON.stringify(message)

  for (const connectedPeer of roomPeers) {
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
 * Get room members as array of usernames (for serialization)
 */
export function getRoomMembersArray(roomId: string): Array<{id: string, username: string}> {
  const room = rooms.get(roomId)
  if (!room) return []
  const result: Array<{id: string, username: string}> = []
  for (const userId of room.members) {
    const peer = getPeerByUserId(userId)
    if (peer) {
      result.push({ id: peer.userId, username: peer.username })
    }
  }
  return result
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
