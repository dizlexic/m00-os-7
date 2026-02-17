import { ref, readonly, onUnmounted, watch } from 'vue'
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

// Shared watcher state
let initialized = false

/**
 * Main WebSocket Composable
 */
export function useWebSocket() {
  const { isAuthenticated, currentUser } = useUser()

  function connect() {
    if (ws || connectionState.value === 'connected' || connectionState.value === 'connecting') {
      return
    }

    connectionState.value = 'connecting'
    lastError.value = null

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

  function subscribe(callback: MessageCallback) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  }

  function notifySubscribers(message: WebSocketMessage) {
    subscribers.forEach(callback => {
      try {
        callback(message)
      } catch (e) {
        console.error('[WebSocket] Error in subscriber:', e)
      }
    })
  }

  // Auto-connect when authenticated (only setup once)
  if (!initialized) {
    watch(isAuthenticated, (authenticated) => {
      if (authenticated) {
        connect()
      } else {
        disconnect()
      }
    }, { immediate: true })
    initialized = true
  }

  return {
    connectionState: readonly(connectionState),
    lastError: readonly(lastError),
    connect,
    disconnect,
    send,
    subscribe
  }
}
