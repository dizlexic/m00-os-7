import { ref, computed, readonly } from 'vue'
import { useUser } from '~/composables/useUser'
import { useWebSocket } from '~/composables/useWebSocket'
import type { ChatStatus, ChatUser, ChatMessage, ChatRoom } from '~/types/chat'

// Singleton state
const messages = ref<ChatMessage[]>([])
const friends = ref<ChatUser[]>([])
const blocked = ref<string[]>([])
const muted = ref<string[]>([])
const rooms = ref<ChatRoom[]>([])
const allUsers = ref<Record<string, string>>({})
const activeChatId = ref<string | null>('lobby')
const status = ref<ChatStatus>('online')
const customStatus = ref('')
let initialized = false

/**
 * Handle incoming WebSocket messages for chat
 */
function handleMessage(message: any) {
  const { type, payload } = message
  const { connectionState } = useWebSocket()
  const isConnected = connectionState.value === 'connected'

      case 'chat-message':
      case 'chat-private-message':
        messages.value.push({
          id: Date.now().toString(),
          senderId: String(payload.senderId),
          senderName: payload.senderName,
          text: payload.text,
          timestamp: Date.now(),
          roomId: payload.roomId ? String(payload.roomId) : undefined,
          recipientId: payload.recipientId ? String(payload.recipientId) : undefined
        })
        break
  switch (type) {
    case 'connect':
      // If we just connected, sync status
      if (isConnected) {
        const { send } = useWebSocket()
        send('chat-status-update', { status: status.value, customStatus: customStatus.value })
      }
      break
        roomId: payload.roomId ? String(payload.roomId) : undefined,
        recipientId: payload.recipientId ? String(payload.recipientId) : undefined
    case 'room-state':
      if (payload.room) {
        const room: ChatRoom = {
          id: payload.room.id,
          name: payload.room.name,
          ownerId: payload.room.ownerId,
          members: payload.room.members,
          memberNames: payload.room.memberNames,
          isPrivate: payload.room.isPrivate
        }
        const existingIndex = rooms.value.findIndex(r => r.id === room.id)
        if (existingIndex >= 0) {
          rooms.value[existingIndex] = room
        } else {
          rooms.value.push(room)
        }
        activeChatId.value = room.id
      }
      break
    case 'room-list':
      if (payload.rooms) {
        rooms.value = payload.rooms.map((r: any) => ({
          id: r.id,
          name: r.name,
          ownerId: r.ownerId,
          members: [], 
          isPrivate: r.isPrivate
        }))
      }
      break
    case 'user-joined':
      if (payload.user) {
        allUsers.value[payload.user.id] = payload.user.username
        // Update any room that the user might have joined
        const roomId = activeChatId.value
        const room = rooms.value.find(r => r.id === roomId)
        if (room) {
          if (!room.members.includes(payload.user.id)) {
            room.members.push(payload.user.id)
            if (!room.memberNames) room.memberNames = {}
            room.memberNames[payload.user.id] = payload.user.username
          }
        }
      }
      break
    case 'user-left':
      if (payload.user) {
        rooms.value.forEach(room => {
          if (room.members.includes(payload.user.id)) {
            room.members = room.members.filter(id => id !== payload.user.id)
            if (room.memberNames) delete room.memberNames[payload.user.id]
          }
        })
        delete allUsers.value[payload.user.id]
      }
      break
    case 'user-list':
      if (payload.users) {
        allUsers.value = payload.users.reduce((acc: any, u: any) => {
          acc[u.id] = u.username
          return acc
        }, {})
      }
      break
    case 'friend-request':
      console.log('Incoming friend request from:', payload.senderName)
      break
    case 'chat-status-update':
      const friend = friends.value.find(f => f.id === String(payload.userId))
      if (friend) {
        friend.status = payload.status
        friend.customStatus = payload.customStatus
      }
      break
  }
}

export function useChat() {
  const { currentUser: authUser } = useUser()
  const { send, subscribe, connectionState } = useWebSocket()

  const isConnected = computed(() => connectionState.value === 'connected')

  // Initialize subscription once
  if (!initialized) {
    subscribe(handleMessage)
    initialized = true
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

  function muteUser(userId: string) {
    if (!muted.value.includes(userId)) {
      muted.value.push(userId)
    }
  }

  function unmuteUser(userId: string) {
    muted.value = muted.value.filter(id => id !== userId)
  }

  function createRoom(name: string, isPrivate: boolean = false) {
    send('room-create', { roomName: name, isPrivate })
  }

  function joinRoom(roomId: string) {
    send('room-join', { roomId })
  }

  function leaveRoom(roomId: string) {
    send('room-leave', { roomId })
    if (activeChatId.value === roomId) {
      activeChatId.value = 'lobby'
    }
    if (roomId !== 'lobby') {
      rooms.value = rooms.value.filter(r => r.id !== roomId)
    }
  }

  function inviteToRoom(roomId: string, userId: string) {
    send('room-invite', { roomId, userId })
  }

  function removeFromRoom(roomId: string, userId: string) {
    send('room-kick', { roomId, userId })
  }

  function refreshRooms() {
    send('room-list')
  }

  function refreshUsers() {
    send('user-list')
  }

  function sendFriendRequest(username: string) {
    send('friend-request', { username })
  }

  return {
    isConnected,
    messages: readonly(messages),
    friends: readonly(friends),
    blocked: readonly(blocked),
    muted: readonly(muted),
    rooms: readonly(rooms),
    allUsers: readonly(allUsers),
    activeChatId,
    status,
    customStatus,
    connect: () => {}, 
    sendMessage,
    updateStatus,
    addFriend,
    removeFriend,
    blockUser,
    unblockUser,
    muteUser,
    unmuteUser,
    createRoom,
    joinRoom,
    leaveRoom,
    inviteToRoom,
    removeFromRoom,
    refreshRooms,
    refreshUsers,
    sendFriendRequest
  }
}
