import { ref, readonly, watch } from 'vue'
import { useUser } from '~/composables/useUser'

export type WebSocketState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface WebSocketMessage {
  type: string
  payload?: any
  userId?: string
  timestamp?: number
}

// Singleton state
const connectionState = ref<WebSocketState>('disconnected')
const lastError = ref<string | null>(null)
let ws: WebSocket | null = null
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null

// Message subscribers
type MessageCallback = (message: WebSocketMessage) => void
const subscribers = new Set<MessageCallback>()

/**
 * Connect to WebSocket
 */
function connect() {
  const { isAuthenticated, currentUser } = useUser()

  if (ws || connectionState.value === 'connected' || connectionState.value === 'connecting') {
    return
  }

  connectionState.value = 'connecting'
  lastError.value = null

  // Ensure we are on the client
  if (import.meta.server) return

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws`

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('[WebSocket] Connected')
      connectionState.value = 'connected'

      // Send initial connect message
      send('connect', {
        username: currentUser.value?.username || 'Guest'
      })
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage
        notifySubscribers(message)
      } catch (e) {
        console.error('[WebSocket] Failed to parse message', e)
      }
    }

    ws.onclose = (event) => {
      console.log(`[WebSocket] Closed: ${event.code} ${event.reason}`)
      ws = null

      if (isAuthenticated.value && !event.wasClean) {
        connectionState.value = 'reconnecting'
        reconnectTimeout = setTimeout(() => {
          connect()
        }, 3000)
      } else {
        connectionState.value = 'disconnected'
      }
    }

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error)
      connectionState.value = 'error'
      lastError.value = 'WebSocket connection error'
    }
  } catch (e) {
    console.error('[WebSocket] Failed to create WebSocket:', e)
    connectionState.value = 'error'
    lastError.value = (e as Error).message
  }
}

/**
 * Disconnect from WebSocket
 */
function disconnect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (ws) {
    ws.close(1000, 'User disconnected')
    ws = null
  }

  connectionState.value = 'disconnected'
}

/**
 * Send a message via WebSocket
 */
function send(type: string, payload?: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type,
      payload,
      timestamp: Date.now()
    }))
    return true
  }
  console.warn(`[WebSocket] Cannot send ${type}: Not connected`)
  return false
}

/**
 * Subscribe to WebSocket messages
 */
function subscribe(callback: MessageCallback) {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

/**
 * Notify all subscribers of a new message
 */
function notifySubscribers(message: WebSocketMessage) {
  subscribers.forEach(callback => {
    try {
      callback(message)
    } catch (e) {
      console.error('[WebSocket] Error in subscriber:', e)
    }
  })
}

// Initialize global watcher (outside of composable to prevent disposal)
if (import.meta.client) {
  const { isAuthenticated } = useUser()
  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      connect()
    } else {
      disconnect()
    }
  }, { immediate: true })
}

/**
 * Main WebSocket Composable
 */
export function useWebSocket() {
  return {
    connectionState: readonly(connectionState),
    lastError: readonly(lastError),
    connect,
    disconnect,
    send,
    subscribe
  }
}
