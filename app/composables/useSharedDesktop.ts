/**
 * Share the Computer (STC) Mode Composable
 *
 * Manages WebSocket connection and state synchronization for shared desktop mode.
 * Allows multiple users to interact with the same desktop simultaneously.
 */

import { ref, computed, readonly, onUnmounted, watch } from 'vue'
import { useUser } from '~/composables/useUser'
import type {
  STCConnectionState,
  STCSettings,
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
import { DEFAULT_STC_SETTINGS } from '~/types/stc'
import type { Position } from '~/types/desktop'

// Singleton state for STC mode
const connectionState = ref<STCConnectionState>('disconnected')
const settings = ref<STCSettings>({ ...DEFAULT_STC_SETTINGS })
const currentSession = ref<STCSession | null>(null)
const remoteUsers = ref<Map<string, RemoteUser>>(new Map())
const localUserId = ref<string | null>(null)
const availableSessions = ref<Array<{ id: string; name: string; hostId: string; userCount: number }>>([])
const lastError = ref<{ code: string; message: string } | null>(null)

// WebSocket instance
let ws: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let cursorThrottleTimeout: ReturnType<typeof setTimeout> | null = null

// Cursor position throttling (send at most every 16ms ~ 60fps)
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

  // Return unsubscribe function
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
 * Send a message through WebSocket
 */
function sendMessage(type: STCMessageType, payload?: unknown): boolean {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn('[STC] Cannot send message: WebSocket not connected')
    return false
  }

  const message: STCMessage = {
    type,
    payload,
    userId: localUserId.value || '',
    timestamp: Date.now()
  }

  try {
    ws.send(JSON.stringify(message))
    return true
  } catch (error) {
    console.error('[STC] Failed to send message:', error)
    return false
  }
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(event: MessageEvent): void {
  let message: STCMessage

  try {
    message = JSON.parse(event.data) as STCMessage
  } catch {
    console.error('[STC] Failed to parse incoming message')
    return
  }

  switch (message.type) {
    case 'connect': {
      const payload = message.payload as { userId: string; username: string; cursor: CursorConfig }
      localUserId.value = payload.userId
      connectionState.value = 'connected'
      console.log(`[STC] Connected as ${payload.username} (${payload.userId})`)
      break
    }

    case 'session-state': {
      const payload = message.payload as SessionStatePayload
      currentSession.value = payload.session

      // Update remote users map
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
      }
      break
    }

    case 'user-left': {
      const payload = message.payload as UserPresencePayload
      if (payload.user) {
        remoteUsers.value.delete(payload.user.id)
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

  // Emit to registered callbacks
  emitMessage(message)
}

/**
 * Connect to WebSocket server
 */
function connect(): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.warn('[STC] Already connected')
    return
  }

  connectionState.value = 'connecting'
  lastError.value = null

  // Determine WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/_ws`

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[STC] WebSocket connected')
      // Send connect message with user info
      const { currentUser } = useUser()
      sendMessage('connect', {
        username: currentUser.value?.username || 'Guest',
        cursor: settings.value.cursor
      })
    }

    ws.onmessage = handleMessage

    ws.onclose = (event) => {
      console.log(`[STC] WebSocket closed: ${event.code} ${event.reason}`)
      connectionState.value = 'disconnected'
      ws = null

      // Attempt reconnect if was previously connected
      if (settings.value.enabled && !event.wasClean) {
        connectionState.value = 'reconnecting'
        reconnectTimeout = setTimeout(() => {
          connect()
        }, 3000)
      }
    }

    ws.onerror = (error) => {
      console.error('[STC] WebSocket error:', error)
      connectionState.value = 'error'
    }
  } catch (error) {
    console.error('[STC] Failed to create WebSocket:', error)
    connectionState.value = 'error'
  }
}

/**
 * Disconnect from WebSocket server
 */
function disconnect(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (ws) {
    ws.close(1000, 'User disconnected')
    ws = null
  }

  connectionState.value = 'disconnected'
  currentSession.value = null
  remoteUsers.value.clear()
  localUserId.value = null
}

/**
 * Create a new shared session
 */
function createSession(sessionName?: string): void {
  sendMessage('session-create', { sessionName })
}

/**
 * Join an existing session
 */
function joinSession(sessionId: string): void {
  sendMessage('session-join', { sessionId })
}

/**
 * Leave the current session
 */
function leaveSession(): void {
  sendMessage('session-leave', {})
}

/**
 * Request list of available sessions
 */
function refreshSessionList(): void {
  sendMessage('session-list', {})
}

/**
 * Send cursor position (throttled)
 */
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

/**
 * Update cursor configuration
 */
function updateCursorConfig(cursor: CursorConfig): void {
  settings.value.cursor = cursor
  sendMessage('cursor-config-update', { cursor })
}

/**
 * Broadcast a desktop action to other users
 */
function broadcastAction(type: STCMessageType, payload: unknown): void {
  if (currentSession.value) {
    sendMessage(type, payload)
  }
}

/**
 * Update STC settings
 */
function updateSettings(newSettings: Partial<STCSettings>): void {
  settings.value = { ...settings.value, ...newSettings }

  // Handle enabled state change
  if ('enabled' in newSettings) {
    if (newSettings.enabled && connectionState.value === 'disconnected') {
      connect()
    } else if (!newSettings.enabled && connectionState.value !== 'disconnected') {
      disconnect()
    }
  }

  // Handle cursor config change
  if ('cursor' in newSettings && newSettings.cursor) {
    updateCursorConfig(newSettings.cursor)
  }
}

/**
 * Main composable function
 */
export function useSharedDesktop() {
  // Clean up on component unmount
  onUnmounted(() => {
    // Don't disconnect on unmount - keep connection alive
    // Only clean up throttle timeout
    if (cursorThrottleTimeout) {
      clearTimeout(cursorThrottleTimeout)
      cursorThrottleTimeout = null
    }
  })

  // Computed properties
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

  // Watch for authentication changes
  watch(isAuthenticated, (val) => {
    if (val && settings.value.enabled) {
      connect()
    } else if (!val) {
      disconnect()
    }
  }, { immediate: true })

  return {
    // State (readonly)
    connectionState: readonly(connectionState),
    settings: readonly(settings),
    currentSession: readonly(currentSession),
    remoteUsers: readonly(remoteUsers),
    localUserId: readonly(localUserId),
    availableSessions: readonly(availableSessions),
    lastError: readonly(lastError),

    // Computed
    isConnected,
    isInSession,
    isHost,
    remoteUsersList,
    userCount,

    // Connection methods
    connect,
    disconnect,

    // Session methods
    createSession,
    joinSession,
    leaveSession,
    refreshSessionList,

    // Cursor methods
    sendCursorPosition,
    updateCursorConfig,

    // Action broadcasting
    broadcastAction,

    // Settings
    updateSettings,

    // Event subscription
    onMessage
  }
}
