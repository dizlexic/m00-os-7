<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChat } from '~/composables/useChat'
import { useUser } from '~/composables/useUser'
import BuddyList from '~/components/chat/BuddyList.vue'
import ChatRoom from '~/components/chat/ChatRoom.vue'

const { currentUser: authUser } = useUser()
const {
  isConnected,
  messages,
  friends,
  rooms,
  allUsers,
  status,
  customStatus,
  activeChatId,
  connect,
  sendMessage,
  updateStatus,
  createRoom,
  joinRoom,
  refreshRooms,
  refreshUsers,
  sendFriendRequest
} = useChat()

const newRoomName = ref('')
const isPrivateRoom = ref(false)
const friendRequestUsername = ref('')

onMounted(() => {
  connect()
  refreshRooms()
  refreshUsers()
})

const activeRoom = computed(() => {
  if (!activeChatId.value) return null
  if (activeChatId.value === 'lobby') {
    return {
      id: 'lobby',
      name: 'System Lobby',
      members: Object.keys(allUsers.value),
      memberNames: allUsers.value
    }
  }
  return rooms.value.find(r => r.id === activeChatId.value) || null
})

const filteredMessages = computed(() => {
  if (!activeChatId.value) return []
  return messages.value.filter(m =>
    m.roomId === activeChatId.value ||
    m.recipientId === activeChatId.value ||
    (m.senderId === activeChatId.value && m.recipientId === authUser.value?.id)
  )
})

function handleSelectBuddy(userId: string) {
  activeChatId.value = userId
}

function handleSelectRoom(roomId: string) {
  activeChatId.value = roomId
  if (roomId !== 'lobby') {
    joinRoom(roomId)
  }
}

function handleSendMessage(text: string) {
  if (activeChatId.value === 'lobby') {
    sendMessage(text, { roomId: 'lobby' })
  } else if (activeRoom.value) {
    sendMessage(text, { roomId: activeChatId.value as string })
  } else if (activeChatId.value) {
    sendMessage(text, { recipientId: activeChatId.value as string })
  }
}

function handleCreateRoom() {
  if (!newRoomName.value.trim()) return
  createRoom(newRoomName.value, isPrivateRoom.value)
  newRoomName.value = ''
  isPrivateRoom.value = false
}

function handleSendFriendRequest() {
  if (!friendRequestUsername.value.trim()) return
  sendFriendRequest(friendRequestUsername.value)
  friendRequestUsername.value = ''
}

// Set lobby as default
onMounted(() => {
  activeChatId.value = 'lobby'
})
</script>

<template>
  <div class="messenger">
    <div class="messenger__sidebar">
      <BuddyList
        :friends="friends"
        :status="status"
        :custom-status="customStatus"
        @update:status="updateStatus"
        @update:customStatus="s => updateStatus(status, s)"
        @select-buddy="handleSelectBuddy"
      />

      <div class="messenger__friend-request">
        <div class="messenger__section-title">Add Friend</div>
        <div class="messenger__input-group">
          <input v-model="friendRequestUsername" placeholder="Username..." @keyup.enter="handleSendFriendRequest" />
          <button @click="handleSendFriendRequest">+</button>
        </div>
      </div>

      <div class="messenger__rooms">
        <div class="messenger__section-title">Rooms</div>
        <div
          class="messenger__room-item"
          :class="{ 'messenger__room-item--active': activeChatId === 'lobby' }"
          @click="handleSelectRoom('lobby')"
        >
          System Lobby
        </div>
        <div
          v-for="room in rooms.filter(r => r.id !== 'lobby')"
          :key="room.id"
          class="messenger__room-item"
          :class="{ 'messenger__room-item--active': activeChatId === room.id }"
          @click="handleSelectRoom(room.id)"
        >
          {{ room.name }} {{ room.isPrivate ? '(P)' : '' }}
        </div>

        <div class="messenger__create-room">
          <div class="messenger__input-group">
            <input v-model="newRoomName" placeholder="New Room..." @keyup.enter="handleCreateRoom" />
            <button @click="handleCreateRoom">+</button>
          </div>
          <label class="messenger__checkbox">
            <input type="checkbox" v-model="isPrivateRoom" /> Private
          </label>
        </div>
      </div>
    </div>
    <div class="messenger__main">
      <template v-if="activeChatId">
        <ChatRoom
          :room-id="activeChatId"
          :room-name="activeRoom?.name || (activeChatId === 'lobby' ? 'System Lobby' : 'Private Chat')"
          :messages="filteredMessages"
          :current-user-id="String(authUser?.id || 'guest')"
          :members="activeRoom?.members || []"
          :member-names="activeRoom?.memberNames || {}"
          @send-message="handleSendMessage"
        />
      </template>
      <div v-else class="messenger__no-chat">
        Select a friend or room to start chatting
      </div>
    </div>
  </div>
</template>

<style scoped>
.messenger {
  display: flex;
  height: 100%;
  background-color: var(--color-white);
}

.messenger__sidebar {
  width: 200px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-black);
}

.messenger__rooms {
  padding: 4px;
  border-top: 1px solid var(--color-black);
}

.messenger__section-title {
  font-weight: bold;
  font-size: var(--font-size-sm);
  padding: 2px 4px;
  background-color: var(--color-gray-light);
  border-bottom: 1px solid var(--color-black);
}

.messenger__input-group {
  display: flex;
  padding: 2px;
  gap: 2px;
}

.messenger__input-group input {
  flex: 1;
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-black);
  padding: 1px 4px;
}

.messenger__input-group button {
  border: 1px solid var(--color-black);
  background-color: var(--color-gray-light);
  cursor: pointer;
  padding: 0 6px;
  font-weight: bold;
}

.messenger__friend-request {
  padding: 4px;
  border-top: 1px solid var(--color-black);
}

.messenger__create-room {
  padding: 4px;
  border-top: 1px dotted var(--color-gray-dark);
  margin-top: 4px;
}

.messenger__checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-sm);
  padding: 2px 4px;
}

.messenger__room-item {
  padding: 4px 8px;
  cursor: pointer;
  font-family: var(--font-system);
  font-size: var(--font-size-md);
}

.messenger__room-item:hover {
  background-color: var(--color-gray-light);
}

.messenger__room-item--active {
  background-color: var(--color-black);
  color: var(--color-white);
}

.messenger__main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messenger__no-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gray-dark);
  font-family: var(--font-system);
  text-align: center;
  padding: 20px;
}
</style>
