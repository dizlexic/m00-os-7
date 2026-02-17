import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import { useWebSocket } from '~/composables/useWebSocket'
import type { ChatStatus, ChatUser, ChatMessage, ChatRoom } from '~/types/chat'

export function useChat() {
  const { currentUser: authUser } = useUser()
  const { send, subscribe, connectionState } = useWebSocket()
  
  const isConnected = computed(() => connectionState.value === 'connected')
  const messages = ref<ChatMessage[]>([])
  const friends = ref<ChatUser[]>([])
  const blocked = ref<string[]>([])
  const rooms = ref<ChatRoom[]>([])
  const activeChatId = ref<string | null>(null)
  const status = ref<ChatStatus>('online')
  const customStatus = ref('')
  
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    unsubscribe = subscribe(handleMessage)
  })

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })

  function handleMessage(message: any) {
    const { type, payload } = message
    
    switch (type) {
      case 'connect':
        // If we just connected, sync status
        if (isConnected.value) {
          updateStatus(status.value, customStatus.value)
        }
        break
      case 'chat-message':
      case 'chat-private-message':
        messages.value.push({
          id: Date.now().toString(),
          senderId: String(payload.senderId),
          text: payload.text,
          timestamp: Date.now(),
          roomId: payload.roomId ? String(payload.roomId) : undefined,
          recipientId: payload.recipientId ? String(payload.recipientId) : undefined
        })
        break
      case 'chat-status-update':
        // Update buddy status in list
        const friend = friends.value.find(f => f.id === String(payload.userId))
        if (friend) {
          friend.status = payload.status
          friend.customStatus = payload.customStatus
        }
        break
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

  return {
    isConnected,
    messages,
    friends,
    blocked,
    rooms,
    activeChatId,
    status,
    customStatus,
    connect: () => {}, // Handled by useWebSocket auto-connect
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
