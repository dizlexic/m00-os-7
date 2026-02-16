import { ref, computed, onUnmounted } from 'vue'
import { useUser } from '~/composables/useUser'
import type { ChatStatus, ChatUser, ChatMessage, ChatRoom } from '~/types/chat'

export function useChat() {
  const { currentUser: authUser } = useUser()
  
  const isConnected = ref(false)
  const messages = ref<ChatMessage[]>([])
  const friends = ref<ChatUser[]>([])
  const blocked = ref<string[]>([])
  const rooms = ref<ChatRoom[]>([])
  const activeChatId = ref<string | null>(null)
  const status = ref<ChatStatus>('online')
  const customStatus = ref('')
  
  let ws: WebSocket | null = null

  function connect() {
    if (ws || isConnected.value) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      isConnected.value = true
      // Send initial connect message
      send('connect', {
        username: authUser.value?.username || 'Guest',
      })
      
      // Request initial state if needed
      updateStatus(status.value, customStatus.value)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleMessage(data)
      } catch (e) {
        console.error('[Chat] Failed to parse message', e)
      }
    }

    ws.onclose = () => {
      isConnected.value = false
      ws = null
    }
  }

  function handleMessage(message: any) {
    const { type, payload } = message
    
    switch (type) {
      case 'chat-message':
      case 'chat-private-message':
        messages.value.push({
          id: Date.now().toString(),
          senderId: payload.senderId,
          text: payload.text,
          timestamp: Date.now(),
          roomId: payload.roomId,
          recipientId: payload.recipientId
        })
        break
      case 'chat-status-update':
        // Update buddy status in list
        const friend = friends.value.find(f => f.id === payload.userId)
        if (friend) {
          friend.status = payload.status
          friend.customStatus = payload.customStatus
        }
        break
    }
  }

  function send(type: string, payload: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }))
    }
  }

  function sendMessage(text: string, options: { roomId?: string, recipientId?: string }) {
    if (options.roomId) {
      send('chat-message', { roomId: options.roomId, text })
    } else if (options.recipientId) {
      send('chat-private-message', { recipientId: options.recipientId, text })
    }
  }

  function updateStatus(newStatus: ChatStatus, newCustomStatus?: string) {
    status.value = newStatus
    if (newCustomStatus !== undefined) customStatus.value = newCustomStatus
    send('chat-status-update', { status: newStatus, customStatus: customStatus.value })
  }

  function addFriend(user: ChatUser) {
    if (!friends.value.find(f => f.id === user.id)) {
      friends.value.push(user)
    }
  }

  function removeFriend(userId: string) {
    friends.value = friends.value.filter(f => f.id !== userId)
  }

  function blockUser(userId: string) {
    if (!blocked.value.includes(userId)) {
      blocked.value.push(userId)
    }
  }

  function unblockUser(userId: string) {
    blocked.value = blocked.value.filter(id => id !== userId)
  }

  function createRoom(name: string) {
    send('session-create', { sessionName: name })
  }

  function joinRoom(roomId: string) {
    send('session-join', { sessionId: roomId })
  }

  onUnmounted(() => {
    if (ws) {
      ws.close()
      ws = null
    }
  })

  return {
    isConnected,
    messages,
    friends,
    blocked,
    rooms,
    activeChatId,
    status,
    customStatus,
    connect,
    sendMessage,
    updateStatus,
    addFriend,
    removeFriend,
    blockUser,
    unblockUser,
    createRoom,
    joinRoom
  }
}
