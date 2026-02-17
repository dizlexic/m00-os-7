<script setup lang="ts">
import { ref } from 'vue'
import type { ChatUser, ChatStatus } from '~/types/chat'

interface Props {
  friends: ChatUser[]
  status: ChatStatus
  customStatus: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:status': [status: ChatStatus]
  'update:customStatus': [status: string]
  'select-buddy': [userId: string]
  'remove-friend': [userId: string]
  'block-user': [userId: string]
  'user-contextmenu': [event: MouseEvent, userId: string, username: string]
}>()

const showStatusMenu = ref(false)

const statuses: { label: string, value: ChatStatus }[] = [
  { label: 'Online', value: 'online' },
  { label: 'Away', value: 'away' },
  { label: 'Busy', value: 'busy' },
  { label: 'Offline', value: 'offline' }
]

function handleStatusChange(s: ChatStatus) {
  emit('update:status', s)
  showStatusMenu.value = false
}

function handleCustomStatusBlur(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:customStatus', target.value)
}
</script>

<template>
  <div class="buddy-list">
    <div class="buddy-list__user-info">
      <div class="buddy-list__status-picker">
        <div
          class="buddy-list__current-status"
          :class="`buddy-list__status--${status}`"
          @click="showStatusMenu = !showStatusMenu"
        >
          {{ status }}
        </div>
        <div v-if="showStatusMenu" class="buddy-list__status-menu">
          <div
            v-for="s in statuses"
            :key="s.value"
            class="buddy-list__status-option"
            @click="handleStatusChange(s.value)"
          >
            {{ s.label }}
          </div>
        </div>
      </div>
      <input
        class="buddy-list__custom-status"
        :value="customStatus"
        placeholder="Set status..."
        @blur="handleCustomStatusBlur"
        @keyup.enter="handleCustomStatusBlur"
      />
    </div>

    <div class="buddy-list__friends">
      <div class="buddy-list__section-title">Friends</div>
      <div
        v-for="friend in friends"
        :key="friend.id"
        class="buddy-list__friend"
        @dblclick="emit('select-buddy', friend.id)"
        @contextmenu="emit('user-contextmenu', $event, friend.id, friend.username)"
      >
        <div class="buddy-list__status-dot" :class="`buddy-list__status--${friend.status}`"></div>
        <span class="buddy-list__friend-name">{{ friend.username }}</span>
        <span v-if="friend.customStatus" class="buddy-list__friend-status">- {{ friend.customStatus }}</span>
      </div>
      <div v-if="friends.length === 0" class="buddy-list__empty">
        No friends yet
      </div>
    </div>
  </div>
</template>

<style scoped>
.buddy-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
}

.buddy-list__user-info {
  padding: 8px;
  border-bottom: 1px solid var(--color-black);
  background-color: var(--color-gray-light);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.buddy-list__status-picker {
  position: relative;
}

.buddy-list__current-status {
  padding: 2px 8px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  cursor: pointer;
  text-transform: capitalize;
}

.buddy-list__status-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  z-index: 10;
  box-shadow: 2px 2px 0 var(--color-black);
}

.buddy-list__status-option {
  padding: 4px 8px;
  cursor: pointer;
}

.buddy-list__status-option:hover {
  background-color: var(--color-black);
  color: var(--color-white);
}

.buddy-list__custom-status {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid var(--color-black);
  font-size: var(--font-size-sm);
}

.buddy-list__friends {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.buddy-list__section-title {
  font-weight: bold;
  padding: 2px 4px;
  background-color: var(--color-gray-light);
  border-bottom: 1px solid var(--color-black);
  margin-bottom: 4px;
}

.buddy-list__friend {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  cursor: pointer;
}

.buddy-list__friend:hover {
  background-color: var(--color-gray-light);
}

.buddy-list__status-dot {
  width: 8px;
  height: 8px;
  border: 1px solid var(--color-black);
}

.buddy-list__status--online { background-color: #00FF00; }
.buddy-list__status--away { background-color: #FFFF00; }
.buddy-list__status--busy { background-color: #FF0000; }
.buddy-list__status--offline { background-color: var(--color-gray-medium); }

.buddy-list__friend-name {
  font-weight: bold;
}

.buddy-list__friend-status {
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
}

.buddy-list__empty {
  padding: 8px;
  color: var(--color-gray-dark);
  font-style: italic;
  text-align: center;
}
</style>
