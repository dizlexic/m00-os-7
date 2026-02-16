<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { getElizaResponse } from '~/utils/eliza'

interface Message {
  id: number
  text: string
  sender: 'user' | 'eliza'
}

const messages = ref<Message[]>([
  { id: 1, text: "How do you do. Please state your problem.", sender: 'eliza' }
])
const userInput = ref('')
const scrollContainer = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  })
}

function handleSend() {
  const input = userInput.value.trim()
  if (!input) return

  // Add user message
  messages.value.push({
    id: Date.now(),
    text: input,
    sender: 'user'
  })

  userInput.value = ''
  scrollToBottom()

  // Simulate Eliza thinking
  setTimeout(() => {
    const response = getElizaResponse(input)
    messages.value.push({
      id: Date.now() + 1,
      text: response,
      sender: 'eliza'
    })
    scrollToBottom()
  }, 500 + Math.random() * 1000)
}

onMounted(() => {
  scrollToBottom()
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
</script>

<template>
  <div class="eliza">
    <div class="eliza__history" ref="scrollContainer">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="eliza__message"
        :class="`eliza__message--${msg.sender}`"
      >
        <span class="eliza__sender">{{ msg.sender === 'eliza' ? 'ELIZA:' : 'YOU:' }}</span>
        <span class="eliza__text">{{ msg.text }}</span>
      </div>
    </div>
    <div class="eliza__input-area">
      <input
        ref="inputRef"
        v-model="userInput"
        type="text"
        class="eliza__input"
        placeholder="Type here..."
        @keyup.enter="handleSend"
      />
      <button class="eliza__send-btn" @click="handleSend">Send</button>
    </div>
  </div>
</template>

<style scoped>
.eliza {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-white);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  border: 1px solid var(--color-black);
}

.eliza__history {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: var(--color-white);
}

/* Custom scrollbar for Eliza to match Mac OS 7 */
.eliza__history::-webkit-scrollbar {
  width: 16px;
}

.eliza__history::-webkit-scrollbar-track {
  background-color: var(--color-white);
  border-left: 1px solid var(--color-black);
}

.eliza__history::-webkit-scrollbar-thumb {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  box-shadow: inset 1px 1px 0 var(--color-gray-light);
}

.eliza__message {
  display: flex;
  gap: 8px;
  line-height: 1.4;
}

.eliza__message--user {
  color: var(--color-black);
}

.eliza__message--eliza {
  color: var(--color-black);
}

.eliza__sender {
  font-weight: bold;
  min-width: 60px;
}

.eliza__text {
  word-break: break-word;
}

.eliza__input-area {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-top: 1px solid var(--color-black);
  background-color: var(--color-gray-light);
}

.eliza__input {
  flex: 1;
  padding: 4px;
  border: 1px solid var(--color-black);
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

.eliza__send-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  box-shadow: 1px 1px 0 var(--color-black);
}

.eliza__send-btn:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}
</style>
