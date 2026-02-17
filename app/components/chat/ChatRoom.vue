<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import type { ChatMessage } from '~/types/chat'

interface Props {
  roomId: string
  roomName: string
  messages: ChatMessage[]
  currentUserId: string
  members?: string[]
  memberNames?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  members: () => [],
  memberNames: () => ({})
})
const emit = defineEmits<{
  'send-message': [text: string]
}>()

const newMessage = ref('')
const scrollContainer = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}

function handleSend() {
  if (!newMessage.value.trim()) return
  emit('send-message', newMessage.value)
  newMessage.value = ''
  scrollToBottom()
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="chat-room">
    <div class="chat-room__header">
      {{ roomName }}
    </div>
    <div class="chat-room__body">
      <div class="chat-room__messages" ref="scrollContainer">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="chat-room__message"
          :class="{ 'chat-room__message--own': msg.senderId === currentUserId }"
        >
          <div class="chat-room__sender">{{ msg.senderId === currentUserId ? 'Me' : (msg.senderName || msg.senderId) }}:</div>
          <div class="chat-room__text">{{ msg.text }}</div>
        </div>
      </div>
      <div v-if="members.length > 0" class="chat-room__sidebar">
        <div class="chat-room__sidebar-title">Members ({{ members.length }})</div>
        <div v-for="memberId in members" :key="memberId" class="chat-room__member">
          {{ memberNames[memberId] || memberId }}
        </div>
      </div>
    </div>
    <div class="chat-room__input-area">
      <input
        v-model="newMessage"
        class="chat-room__input"
        placeholder="Type a message..."
        @keyup.enter="handleSend"
      />
      <button class="chat-room__send-btn" @click="handleSend">Send</button>
    </div>
  </div>
</template>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
}

.chat-room__header {
  padding: 4px 8px;
  background-color: var(--color-gray-dark);
  color: var(--color-white);
  font-weight: bold;
}

.chat-room__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.chat-room__messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-room__sidebar {
  width: 150px;
  border-left: 1px solid var(--color-black);
  background-color: var(--color-gray-light);
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-sm);
}

.chat-room__sidebar-title {
  padding: 4px;
  font-weight: bold;
  border-bottom: 1px solid var(--color-black);
  background-color: var(--color-gray-medium);
}

.chat-room__member {
  padding: 2px 4px;
}

.chat-room__message {
  display: flex;
  gap: 4px;
}

.chat-room__message--own {
  color: var(--color-highlight);
}

.chat-room__sender {
  font-weight: bold;
}

.chat-room__input-area {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-top: 1px solid var(--color-black);
  background-color: var(--color-gray-light);
}

.chat-room__input {
  flex: 1;
  padding: 4px;
  border: 1px solid var(--color-black);
  outline: none;
}

.chat-room__send-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  cursor: pointer;
  box-shadow: 1px 1px 0 var(--color-black);
}

.chat-room__send-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}
</style>
