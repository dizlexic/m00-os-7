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
  status,
  customStatus,
  activeChatId,
  connect,
  sendMessage,
  updateStatus
} = useChat()

onMounted(() => {
  connect()
})

const activeRoom = computed(() => {
  if (!activeChatId.value) return null
  // Simple logic for now: if it's in room list, it's a room.
  // For MVP, let's just assume we have one main room.
  return { id: 'lobby', name: 'System Lobby' }
})

const filteredMessages = computed(() => {
  if (!activeChatId.value) return []
  return messages.value.filter(m => m.roomId === activeChatId.value || m.recipientId === activeChatId.value || m.senderId === activeChatId.value)
})

function handleSelectBuddy(userId: string) {
  activeChatId.value = userId
}

function handleSendMessage(text: string) {
  if (activeChatId.value === 'lobby') {
    sendMessage(text, { roomId: 'lobby' })
  } else if (activeChatId.value) {
    sendMessage(text, { recipientId: activeChatId.value })
  }
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
      <div class="messenger__rooms">
        <div class="messenger__section-title">Rooms</div>
        <div
          class="messenger__room-item"
          :class="{ 'messenger__room-item--active': activeChatId === 'lobby' }"
          @click="activeChatId = 'lobby'"
        >
          System Lobby
        </div>
      </div>
    </div>
    <div class="messenger__main">
      <template v-if="activeChatId">
        <ChatRoom
          :room-id="activeChatId"
          :room-name="activeChatId === 'lobby' ? 'System Lobby' : 'Private Chat'"
          :messages="filteredMessages"
          :current-user-id="String(authUser?.id || 'guest')"
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
