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
  const muted = ref<string[]>([])
  const rooms = ref<ChatRoom[]>([])
  const allUsers = ref<Record<string, string>>({})
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
          senderName: payload.senderName,
          text: payload.text,
          timestamp: Date.now(),
          roomId: payload.roomId ? String(payload.roomId) : undefined,
          recipientId: payload.recipientId ? String(payload.recipientId) : undefined
        })
        break
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
            members: [], // We don't have members in the list
            isPrivate: r.isPrivate
          }))
        }
        break
      case 'user-joined':
        if (payload.user) {
          allUsers.value[payload.user.id] = payload.user.username
          const roomId = activeChatId.value // Assuming user joined the active room
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
          const room = rooms.value.find(r => r.members.includes(payload.user.id))
          if (room) {
            room.members = room.members.filter(id => id !== payload.user.id)
            if (room.memberNames) delete room.memberNames[payload.user.id]
          }
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
        // Handle incoming friend request
        console.log('Incoming friend request from:', payload.senderName)
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
    // Remove from local rooms list if it's not the lobby
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
    messages,
    friends,
    blocked,
    muted,
    rooms,
    allUsers,
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
