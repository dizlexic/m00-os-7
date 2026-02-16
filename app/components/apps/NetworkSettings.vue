<script setup lang="ts">
/**
 * NetworkSettings Component
 *
 * Control panel for Network (STC) mode settings.
 * Allows users to enable/disable STC mode and manage shared sessions.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSharedDesktop } from '~/composables/useSharedDesktop'

const {
  connectionState,
  settings,
  currentSession,
  isConnected,
  isInSession,
  isHost,
  remoteUsersList,
  availableSessions,
  userCount,
  connect,
  disconnect,
  createSession,
  joinSession,
  leaveSession,
  refreshSessionList,
  updateSettings
} = useSharedDesktop()

// Local state for form inputs
const newSessionName = ref('')
const selectedSessionId = ref('')

// Refresh session list periodically when connected but not in session
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (isConnected.value && !isInSession.value) {
    refreshSessionList()
  }

  refreshInterval = setInterval(() => {
    if (isConnected.value && !isInSession.value) {
      refreshSessionList()
    }
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

/** Connection status text */
const connectionStatusText = computed(() => {
  switch (connectionState.value) {
    case 'disconnected': return 'Disconnected'
    case 'connecting': return 'Connecting...'
    case 'connected': return 'Connected'
    case 'reconnecting': return 'Reconnecting...'
    case 'error': return 'Connection Error'
    default: return 'Unknown'
  }
})

/** Connection status class */
const connectionStatusClass = computed(() => ({
  'status--disconnected': connectionState.value === 'disconnected',
  'status--connecting': connectionState.value === 'connecting' || connectionState.value === 'reconnecting',
  'status--connected': connectionState.value === 'connected',
  'status--error': connectionState.value === 'error'
}))

/** Handle enable/disable toggle */
function handleToggleEnabled() {
  updateSettings({ enabled: !settings.value.enabled })
}

/** Handle create session */
function handleCreateSession() {
  const name = newSessionName.value.trim() || undefined
  createSession(name)
  newSessionName.value = ''
}

/** Handle join session */
function handleJoinSession() {
  if (selectedSessionId.value) {
    joinSession(selectedSessionId.value)
    selectedSessionId.value = ''
  }
}

/** Handle leave session */
function handleLeaveSession() {
  leaveSession()
}
</script>

<template>
  <div class="network-settings">
    <!-- Header -->
    <div class="network-settings__header">
      <h3 class="network-settings__title">Network</h3>
      <p class="network-settings__description">
        Manage your network connection and shared sessions.
      </p>
    </div>

    <!-- Enable/Disable Section -->
    <div class="network-settings__section">
      <div class="network-settings__row">
        <label class="network-settings__label">STC Mode</label>
        <button
          class="mac-button"
          :class="{ 'mac-button--active': settings.enabled }"
          @click="handleToggleEnabled"
        >
          {{ settings.enabled ? 'Enabled' : 'Disabled' }}
        </button>
      </div>

      <div class="network-settings__row">
        <label class="network-settings__label">Status</label>
        <span class="network-settings__status" :class="connectionStatusClass">
          {{ connectionStatusText }}
        </span>
      </div>
    </div>

    <!-- Session Section (only when connected) -->
    <div v-if="isConnected" class="network-settings__section">
      <h4 class="network-settings__section-title">Session</h4>

      <!-- Current Session Info -->
      <div v-if="isInSession" class="network-settings__session-info">
        <div class="network-settings__row">
          <label class="network-settings__label">Session Name</label>
          <span>{{ currentSession?.name }}</span>
        </div>
        <div class="network-settings__row">
          <label class="network-settings__label">Users</label>
          <span>{{ userCount }}</span>
        </div>
        <div class="network-settings__row">
          <label class="network-settings__label">Role</label>
          <span>{{ isHost ? 'Host' : 'Guest' }}</span>
        </div>

        <!-- Connected Users List -->
        <div v-if="remoteUsersList.length > 0" class="network-settings__users">
          <label class="network-settings__label">Connected Users</label>
          <ul class="network-settings__user-list">
            <li
              v-for="user in remoteUsersList"
              :key="user.id"
              class="network-settings__user-item"
            >
              <span
                class="network-settings__user-color"
                :style="{ backgroundColor: user.cursor.color }"
              ></span>
              {{ user.username }}
            </li>
          </ul>
        </div>

        <button class="mac-button" @click="handleLeaveSession">
          Leave Session
        </button>
      </div>

      <!-- Create/Join Session (when not in session) -->
      <div v-else class="network-settings__session-actions">
        <!-- Create Session -->
        <div class="network-settings__create-session">
          <label class="network-settings__label">Create New Session</label>
          <div class="network-settings__input-row">
            <input
              v-model="newSessionName"
              type="text"
              class="mac-input"
              placeholder="Session name (optional)"
            />
            <button class="mac-button" @click="handleCreateSession">
              Create
            </button>
          </div>
        </div>

        <!-- Join Session -->
        <div class="network-settings__join-session">
          <label class="network-settings__label">Join Existing Session</label>
          <div v-if="availableSessions.length > 0" class="network-settings__input-row">
            <select v-model="selectedSessionId" class="mac-select">
              <option value="">Select a session...</option>
              <option
                v-for="session in availableSessions"
                :key="session.id"
                :value="session.id"
              >
                {{ session.name }} ({{ session.userCount }} users)
              </option>
            </select>
            <button
              class="mac-button"
              :disabled="!selectedSessionId"
              @click="handleJoinSession"
            >
              Join
            </button>
          </div>
          <p v-else class="network-settings__no-sessions">
            No active sessions available.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.network-settings {
  padding: var(--spacing-md);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  height: 100%;
  overflow-y: auto;
}

.network-settings__header {
  margin-bottom: var(--spacing-lg);
}

.network-settings__title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.network-settings__description {
  margin: 0;
  color: var(--color-gray-dark);
  font-size: var(--font-size-sm);
}

.network-settings__section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
}

.network-settings__section:last-child {
  border-bottom: none;
}

.network-settings__section-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: bold;
}

.network-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.network-settings__label {
  font-weight: bold;
  min-width: 120px;
}

.network-settings__status {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: var(--font-size-sm);
}

.status--disconnected {
  background-color: var(--color-gray-light);
  color: var(--color-gray-dark);
}

.status--connecting {
  background-color: #FFF3CD;
  color: #856404;
}

.status--connected {
  background-color: #D4EDDA;
  color: #155724;
}

.status--error {
  background-color: #F8D7DA;
  color: #721C24;
}

.network-settings__session-info,
.network-settings__session-actions {
  margin-top: var(--spacing-sm);
}

.network-settings__users {
  margin: var(--spacing-sm) 0;
}

.network-settings__user-list {
  list-style: none;
  margin: var(--spacing-xs) 0;
  padding: 0;
  max-height: 100px;
  overflow-y: auto;
  border: 1px solid var(--color-gray-light);
  background: var(--color-white);
}

.network-settings__user-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-gray-light);
}

.network-settings__user-item:last-child {
  border-bottom: none;
}

.network-settings__user-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--color-black);
}

.network-settings__create-session,
.network-settings__join-session {
  margin-bottom: var(--spacing-md);
}

.network-settings__input-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.network-settings__input-row .mac-input,
.network-settings__input-row .mac-select {
  flex: 1;
}

.network-settings__no-sessions {
  color: var(--color-gray-dark);
  font-style: italic;
  font-size: var(--font-size-sm);
  margin: var(--spacing-xs) 0;
}

/* Mac-style inputs */
.mac-input,
.mac-select {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  padding: 4px 8px;
  border: 1px solid var(--color-black);
  background: var(--color-white);
}

.mac-button {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  padding: 4px 12px;
  background: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.mac-button:hover {
  background: var(--color-gray-light);
}

.mac-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mac-button--active {
  background: var(--color-highlight);
  color: var(--color-highlight-text);
}
</style>
