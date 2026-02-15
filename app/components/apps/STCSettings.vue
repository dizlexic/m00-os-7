<script setup lang="ts">
/**
 * STCSettings Component
 *
 * Control panel for Share the Computer (STC) mode settings.
 * Allows users to enable/disable STC mode, customize cursor appearance,
 * and manage shared sessions.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSharedDesktop } from '~/composables/useSharedDesktop'
import { CURSOR_COLORS, CURSOR_COLOR_NAMES, CURSOR_STYLES } from '~/types/stc'
import type { CursorStyle, CursorColor } from '~/types/stc'

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

/** Handle cursor style change */
function handleCursorStyleChange(style: CursorStyle) {
  updateSettings({
    cursor: { ...settings.value.cursor, style }
  })
}

/** Handle cursor color change */
function handleCursorColorChange(color: CursorColor | string) {
  updateSettings({
    cursor: { ...settings.value.cursor, color }
  })
}

/** Handle show labels toggle */
function handleToggleLabels() {
  updateSettings({ showCursorLabels: !settings.value.showCursorLabels })
}

/** Handle show remote cursors toggle */
function handleToggleRemoteCursors() {
  updateSettings({ showRemoteCursors: !settings.value.showRemoteCursors })
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

/** Get cursor style display name */
function getCursorStyleName(style: CursorStyle): string {
  const names: Record<CursorStyle, string> = {
    arrow: 'Arrow',
    hand: 'Hand',
    crosshair: 'Crosshair',
    pointer: 'Pointer'
  }
  return names[style]
}
</script>

<template>
  <div class="stc-settings">
    <!-- Header -->
    <div class="stc-settings__header">
      <h3 class="stc-settings__title">Share the Computer</h3>
      <p class="stc-settings__description">
        Allow multiple users to interact with the desktop simultaneously.
      </p>
    </div>

    <!-- Enable/Disable Section -->
    <div class="stc-settings__section">
      <div class="stc-settings__row">
        <label class="stc-settings__label">STC Mode</label>
        <button
          class="mac-button"
          :class="{ 'mac-button--active': settings.enabled }"
          @click="handleToggleEnabled"
        >
          {{ settings.enabled ? 'Enabled' : 'Disabled' }}
        </button>
      </div>

      <div class="stc-settings__row">
        <label class="stc-settings__label">Status</label>
        <span class="stc-settings__status" :class="connectionStatusClass">
          {{ connectionStatusText }}
        </span>
      </div>
    </div>

    <!-- Session Section (only when connected) -->
    <div v-if="isConnected" class="stc-settings__section">
      <h4 class="stc-settings__section-title">Session</h4>

      <!-- Current Session Info -->
      <div v-if="isInSession" class="stc-settings__session-info">
        <div class="stc-settings__row">
          <label class="stc-settings__label">Session Name</label>
          <span>{{ currentSession?.name }}</span>
        </div>
        <div class="stc-settings__row">
          <label class="stc-settings__label">Users</label>
          <span>{{ userCount }}</span>
        </div>
        <div class="stc-settings__row">
          <label class="stc-settings__label">Role</label>
          <span>{{ isHost ? 'Host' : 'Guest' }}</span>
        </div>

        <!-- Connected Users List -->
        <div v-if="remoteUsersList.length > 0" class="stc-settings__users">
          <label class="stc-settings__label">Connected Users</label>
          <ul class="stc-settings__user-list">
            <li
              v-for="user in remoteUsersList"
              :key="user.id"
              class="stc-settings__user-item"
            >
              <span
                class="stc-settings__user-color"
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
      <div v-else class="stc-settings__session-actions">
        <!-- Create Session -->
        <div class="stc-settings__create-session">
          <label class="stc-settings__label">Create New Session</label>
          <div class="stc-settings__input-row">
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
        <div class="stc-settings__join-session">
          <label class="stc-settings__label">Join Existing Session</label>
          <div v-if="availableSessions.length > 0" class="stc-settings__input-row">
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
          <p v-else class="stc-settings__no-sessions">
            No active sessions available.
          </p>
        </div>
      </div>
    </div>

    <!-- Cursor Settings Section -->
    <div class="stc-settings__section">
      <h4 class="stc-settings__section-title">Cursor Settings</h4>

      <!-- Cursor Style -->
      <div class="stc-settings__row">
        <label class="stc-settings__label">Cursor Style</label>
        <div class="stc-settings__cursor-styles">
          <button
            v-for="style in CURSOR_STYLES"
            :key="style"
            class="stc-settings__cursor-style-btn"
            :class="{ 'stc-settings__cursor-style-btn--active': settings.cursor.style === style }"
            :title="getCursorStyleName(style)"
            @click="handleCursorStyleChange(style)"
          >
            {{ getCursorStyleName(style) }}
          </button>
        </div>
      </div>

      <!-- Cursor Color -->
      <div class="stc-settings__row">
        <label class="stc-settings__label">Cursor Color</label>
        <div class="stc-settings__cursor-colors">
          <button
            v-for="color in CURSOR_COLORS"
            :key="color"
            class="stc-settings__color-btn"
            :class="{ 'stc-settings__color-btn--active': settings.cursor.color === color }"
            :style="{ backgroundColor: color }"
            :title="CURSOR_COLOR_NAMES[color]"
            @click="handleCursorColorChange(color)"
          ></button>
        </div>
      </div>
    </div>

    <!-- Display Settings Section -->
    <div class="stc-settings__section">
      <h4 class="stc-settings__section-title">Display Settings</h4>

      <div class="stc-settings__row">
        <label class="stc-settings__checkbox-label">
          <input
            type="checkbox"
            :checked="settings.showRemoteCursors"
            @change="handleToggleRemoteCursors"
          />
          Show remote cursors
        </label>
      </div>

      <div class="stc-settings__row">
        <label class="stc-settings__checkbox-label">
          <input
            type="checkbox"
            :checked="settings.showCursorLabels"
            @change="handleToggleLabels"
          />
          Show username labels on cursors
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stc-settings {
  padding: var(--spacing-md);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  height: 100%;
  overflow-y: auto;
}

.stc-settings__header {
  margin-bottom: var(--spacing-lg);
}

.stc-settings__title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.stc-settings__description {
  margin: 0;
  color: var(--color-gray-dark);
  font-size: var(--font-size-sm);
}

.stc-settings__section {
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-gray-light);
}

.stc-settings__section:last-child {
  border-bottom: none;
}

.stc-settings__section-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-md);
  font-weight: bold;
}

.stc-settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.stc-settings__label {
  font-weight: bold;
  min-width: 120px;
}

.stc-settings__status {
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

.stc-settings__session-info,
.stc-settings__session-actions {
  margin-top: var(--spacing-sm);
}

.stc-settings__users {
  margin: var(--spacing-sm) 0;
}

.stc-settings__user-list {
  list-style: none;
  margin: var(--spacing-xs) 0;
  padding: 0;
  max-height: 100px;
  overflow-y: auto;
  border: 1px solid var(--color-gray-light);
  background: var(--color-white);
}

.stc-settings__user-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-gray-light);
}

.stc-settings__user-item:last-child {
  border-bottom: none;
}

.stc-settings__user-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--color-black);
}

.stc-settings__create-session,
.stc-settings__join-session {
  margin-bottom: var(--spacing-md);
}

.stc-settings__input-row {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-xs);
}

.stc-settings__input-row .mac-input,
.stc-settings__input-row .mac-select {
  flex: 1;
}

.stc-settings__no-sessions {
  color: var(--color-gray-dark);
  font-style: italic;
  font-size: var(--font-size-sm);
  margin: var(--spacing-xs) 0;
}

.stc-settings__cursor-styles {
  display: flex;
  gap: var(--spacing-xs);
}

.stc-settings__cursor-style-btn {
  padding: 4px 8px;
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  background: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.stc-settings__cursor-style-btn:hover {
  background: var(--color-gray-light);
}

.stc-settings__cursor-style-btn--active {
  background: var(--color-highlight);
  color: var(--color-highlight-text);
}

.stc-settings__cursor-colors {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.stc-settings__color-btn {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-white);
  outline: 1px solid var(--color-black);
  cursor: pointer;
  padding: 0;
}

.stc-settings__color-btn:hover {
  transform: scale(1.1);
}

.stc-settings__color-btn--active {
  border-color: var(--color-black);
  outline-width: 2px;
}

.stc-settings__checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.stc-settings__checkbox-label input {
  margin: 0;
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
