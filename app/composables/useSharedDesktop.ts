/**
 * Share the Computer (STC) Mode Composable
 *
 * Manages WebSocket connection and state synchronization for shared desktop mode.
 * Allows multiple users to interact with the same desktop simultaneously.
 */

import { ref, computed, readonly, onUnmounted, onMounted, watch } from 'vue'
import { useUser } from '~/composables/useUser'
import { useWebSocket } from '~/composables/useWebSocket'
import type {
  STCConnectionState,
  NetworkSettings,
  STCSession,
  RemoteUser,
  CursorConfig,
  STCMessage,
  STCMessageType,
  CursorMovePayload,
  CursorConfigPayload,
  SessionStatePayload,
  UserPresencePayload,
  ErrorPayload
} from '~/types/stc'
import { DEFAULT_NETWORK_SETTINGS } from '~/types/stc'
import type { Position } from '~/types/desktop'

// Singleton state for STC mode
const settings = ref<NetworkSettings>({ ...DEFAULT_NETWORK_SETTINGS })
const currentSession = ref<STCSession | null>(null)
const remoteUsers = ref<Map<string, RemoteUser>>(new Map())
const localUserId = ref<string | null>(null)
const availableSessions = ref<Array<{ id: string; name: string; hostId: string; userCount: number }>>([])
const lastError = ref<{ code: string; message: string } | null>(null)
let initialized = false

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(message: STCMessage): void {
  switch (message.type) {
    case 'connect': {
      const payload = message.payload as { userId: string; username: string; cursor: CursorConfig }
      localUserId.value = payload.userId
      console.log(`[STC] Connected as ${payload.username} (${payload.userId})`)
      break
    }

    case 'session-state': {
      const payload = message.payload as SessionStatePayload
      currentSession.value = payload.session

      remoteUsers.value.clear()
      for (const user of payload.session.users) {
        if (user.id !== localUserId.value) {
          remoteUsers.value.set(user.id, user)
        }
      }
      break
    }

    case 'session-list': {
      const payload = message.payload as { sessions: Array<{ id: string; name: string; hostId: string; userCount: number }> }
      availableSessions.value = payload.sessions
      break
    }

    case 'session-leave': {
      currentSession.value = null
      remoteUsers.value.clear()
      break
    }

    case 'user-joined': {
      const payload = message.payload as UserPresencePayload
      if (payload.user && payload.user.id !== localUserId.value) {
        remoteUsers.value.set(payload.user.id, payload.user)
        
        // Also update currentSession users array to keep userCount in sync
        if (currentSession.value) {
          const users = [...currentSession.value.users]
          if (!users.find(u => u.id === payload.user.id)) {
            users.push(payload.user)
            currentSession.value = { ...currentSession.value, users }
          }
        }
      }
      break
    }

    case 'user-left': {
      const payload = message.payload as UserPresencePayload
      if (payload.user) {
        remoteUsers.value.delete(payload.user.id)
        
        // Also update currentSession users array
        if (currentSession.value) {
          const users = currentSession.value.users.filter(u => u.id !== payload.user.id)
          currentSession.value = { ...currentSession.value, users }
        }
      }
      break
    }

    case 'cursor-move': {
      const payload = message.payload as CursorMovePayload & { userId: string }
      const user = remoteUsers.value.get(payload.userId)
      if (user) {
        user.position = payload.position
        user.lastActivity = Date.now()
      }
      break
    }

    case 'cursor-config-update': {
      const payload = message.payload as CursorConfigPayload & { userId: string }
      const user = remoteUsers.value.get(payload.userId)
      if (user) {
        user.cursor = payload.cursor
      }
      break
    }

    case 'error': {
      const payload = message.payload as ErrorPayload
      lastError.value = payload
      console.error(`[STC] Error: ${payload.code} - ${payload.message}`)
      break
    }
  }

  emitMessage(message)
}

// Cursor position throttling
let cursorThrottleTimeout: ReturnType<typeof setTimeout> | null = null
const CURSOR_THROTTLE_MS = 16
let pendingCursorPosition: Position | null = null

// Event callbacks
type MessageCallback = (message: STCMessage) => void
const messageCallbacks = new Map<STCMessageType, Set<MessageCallback>>()

/**
 * Register a callback for a specific message type
 */
function onMessage(type: STCMessageType, callback: MessageCallback): () => void {
  if (!messageCallbacks.has(type)) {
    messageCallbacks.set(type, new Set())
  }
  messageCallbacks.get(type)!.add(callback)

  return () => {
    messageCallbacks.get(type)?.delete(callback)
  }
}

/**
 * Emit a message to all registered callbacks
 */
function emitMessage(message: STCMessage): void {
  const callbacks = messageCallbacks.get(message.type)
  if (callbacks) {
    for (const callback of callbacks) {
      try {
        callback(message)
      } catch (error) {
        console.error(`[STC] Error in message callback for ${message.type}:`, error)
      }
    }
  }
}

/**
 * Main composable function
 */
export function useSharedDesktop() {
  const { send, subscribe, connectionState, connect: wsConnect, disconnect: wsDisconnect } = useWebSocket()
  const { isAuthenticated } = useUser()

  if (!initialized) {
    subscribe(handleMessage as any)
    initialized = true
  }

  onUnmounted(() => {
    if (cursorThrottleTimeout) {
      clearTimeout(cursorThrottleTimeout)
      cursorThrottleTimeout = null
    }
  })

  function sendMessage(type: STCMessageType, payload?: unknown): boolean {
    return send(type, payload)
  }

  function createSession(sessionName?: string): void {
    sendMessage('session-create', { sessionName })
  }

  function joinSession(sessionId: string): void {
    sendMessage('session-join', { sessionId })
  }

  function leaveSession(): void {
    sendMessage('session-leave', {})
  }

  function refreshSessionList(): void {
    sendMessage('session-list', {})
  }

  function sendCursorPosition(position: Position): void {
    pendingCursorPosition = position

    if (!cursorThrottleTimeout) {
      cursorThrottleTimeout = setTimeout(() => {
        if (pendingCursorPosition) {
          sendMessage('cursor-move', { position: pendingCursorPosition })
          pendingCursorPosition = null
        }
        cursorThrottleTimeout = null
      }, CURSOR_THROTTLE_MS)
    }
  }

  function updateCursorConfig(cursor: CursorConfig): void {
    settings.value.cursor = cursor
    sendMessage('cursor-config-update', { cursor })
  }

  function broadcastAction(type: STCMessageType, payload: unknown): void {
    if (currentSession.value) {
      sendMessage(type, payload)
    }
  }

  function updateSettings(newSettings: Partial<NetworkSettings>): void {
    settings.value = { ...settings.value, ...newSettings }

    if ('enabled' in newSettings) {
      if (newSettings.enabled && connectionState.value === 'disconnected') {
        wsConnect()
      } else if (!newSettings.enabled && connectionState.value !== 'disconnected') {
        wsDisconnect()
      }
    }

    if ('cursor' in newSettings && newSettings.cursor) {
      updateCursorConfig(newSettings.cursor)
    }
  }

  const isConnected = computed(() => connectionState.value === 'connected')
  const isInSession = computed(() => currentSession.value !== null)
  const isHost = computed(() => {
    if (!currentSession.value || !localUserId.value) return false
    return currentSession.value.hostId === localUserId.value
  })
  const remoteUsersList = computed(() => Array.from(remoteUsers.value.values()))
  const userCount = computed(() => {
    if (!currentSession.value) return 0
    return currentSession.value.users.length
  })

  return {
    connectionState: connectionState as any,
    settings: readonly(settings),
    currentSession: readonly(currentSession),
    remoteUsers: readonly(remoteUsers),
    localUserId: readonly(localUserId),
    availableSessions: readonly(availableSessions),
    lastError: readonly(lastError),
    isConnected,
    isInSession,
    isHost,
    remoteUsersList,
    userCount,
    connect: wsConnect,
    disconnect: wsDisconnect,
    createSession,
    joinSession,
    leaveSession,
    refreshSessionList,
    sendCursorPosition,
    updateCursorConfig,
    broadcastAction,
    updateSettings,
    onMessage
  }
}
