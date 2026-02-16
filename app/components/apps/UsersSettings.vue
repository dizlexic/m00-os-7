<script setup lang="ts">
/**
 * UsersSettings Component
 *
 * Control panel for managing users and groups.
 * Allows viewing, creating, and deleting users.
 */
import { ref, computed, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import { useSharedDesktop } from '~/composables/useSharedDesktop'

const { users, currentUser, fetchUsers, register, removeUser } = useUser()
const {
  settings: stcSettings,
  updateSettings,
  isConnected,
  connectionState,
  currentSession,
  createSession,
  leaveSession
} = useSharedDesktop()

// Form state
const newUsername = ref('')
const newPassword = ref('')
const error = ref('')
const isLoading = ref(false)
const sessionName = ref('')

// Computed
const userCount = computed(() => users.value.length)
const stcEnabled = computed({
  get: () => stcSettings.value.enabled,
  set: (val) => updateSettings({ enabled: val })
})

// Fetch users on mount
onMounted(async () => {
  await fetchUsers()
})

// Create user
async function handleCreateUser(): Promise<void> {
  error.value = ''

  // Validation
  if (!newUsername.value.trim()) {
    error.value = 'Username is required'
    return
  }

  if (!newPassword.value) {
    error.value = 'Password is required'
    return
  }

  isLoading.value = true

  try {
    const success = await register(newUsername.value.trim(), newPassword.value)
    if (success) {
      // Clear form
      newUsername.value = ''
      newPassword.value = ''
      // Refresh user list
      await fetchUsers()
    } else {
      error.value = 'Failed to create user'
    }
  } catch (e) {
    error.value = 'Failed to create user'
  } finally {
    isLoading.value = false
  }
}

// Delete user
async function handleDeleteUser(userId: number): Promise<void> {
  isLoading.value = true

  try {
    const success = await removeUser(userId)
    if (success) {
      await fetchUsers()
    }
  } catch (e) {
    error.value = 'Failed to delete user'
  } finally {
    isLoading.value = false
  }
}

// Check if user can be deleted (not current user)
function canDeleteUser(userId: number | string): boolean {
  return currentUser.value?.id !== userId
}

function handleCreateSession() {
  createSession(sessionName.value || undefined)
  sessionName.value = ''
}
</script>

<template>
  <div class="users-settings">
    <div class="users-settings__section">
      <h3 class="users-settings__title">Users</h3>
      <div class="users-settings__count">
        {{ userCount }} user{{ userCount !== 1 ? 's' : '' }}
      </div>

      <div class="users-settings__list">
        <div v-if="users.length === 0" class="users-settings__empty">
          No users found.
        </div>
        <div
          v-for="user in users"
          :key="user.id"
          class="users-settings__user"
        >
          <div class="users-settings__user-icon">
            <img src="/assets/icons/system/document.png" alt="" draggable="false" />
          </div>
          <div class="users-settings__user-name">
            {{ user.username }}
            <span v-if="currentUser?.id === user.id" class="users-settings__current-badge">
              (you)
            </span>
          </div>
          <button
            v-if="canDeleteUser(user.id)"
            :data-testid="`delete-user-${user.id}`"
            class="users-settings__delete-btn"
            :disabled="isLoading"
            @click="handleDeleteUser(user.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="users-settings__section">
      <h3 class="users-settings__title">Create New User</h3>

      <div v-if="error" class="users-settings__error">
        {{ error }}
      </div>

      <div class="users-settings__form">
        <div class="users-settings__field">
          <label for="new-username">Username:</label>
          <input
            id="new-username"
            v-model="newUsername"
            type="text"
            class="mac-input"
            placeholder="Enter username"
            :disabled="isLoading"
          />
        </div>

        <div class="users-settings__field">
          <label for="new-password">Password:</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            class="mac-input"
            placeholder="Enter password"
            :disabled="isLoading"
          />
        </div>

        <div class="users-settings__actions">
          <button
            data-testid="create-user-btn"
            class="mac-button"
            :disabled="isLoading"
            @click="handleCreateUser"
          >
            Create User
          </button>
        </div>
      </div>
    </div>

    <!-- Share the Computer Section -->
    <div class="users-settings__section">
      <h3 class="users-settings__title">Share the Computer</h3>

      <div class="users-settings__stc-status mb-md">
        Status: <span :class="`status--${connectionState}`">{{ connectionState }}</span>
      </div>

      <div class="users-settings__field users-settings__field--row">
        <label for="stc-enabled" class="cursor-pointer">Enable Sharing:</label>
        <input
          id="stc-enabled"
          v-model="stcEnabled"
          type="checkbox"
          class="mac-checkbox"
        />
      </div>

      <template v-if="stcEnabled && isConnected">
        <div v-if="!currentSession" class="users-settings__session-controls mt-md">
          <div class="users-settings__field">
            <label for="session-name">Session Name:</label>
            <input
              id="session-name"
              v-model="sessionName"
              type="text"
              class="mac-input"
              placeholder="My Shared Desktop"
              @keyup.enter="handleCreateSession"
            />
          </div>
          <div class="users-settings__actions">
            <button class="mac-button" @click="handleCreateSession">
              Start Session
            </button>
          </div>
        </div>
        <div v-else class="users-settings__session-info mt-md">
          <p class="mb-sm">Active Session: <strong>{{ currentSession.name }}</strong></p>
          <div class="users-settings__actions">
            <button class="mac-button" @click="leaveSession">
              Stop Session
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.users-settings {
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.users-settings__section {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-md);
  box-shadow: 1px 1px 0 var(--color-white) inset;
}

.users-settings__title {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  font-weight: bold;
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-gray-light);
  padding-bottom: var(--spacing-xs);
}

.users-settings__count {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
  margin-bottom: var(--spacing-md);
}

.users-settings__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 150px;
  overflow-y: auto;
}

.users-settings__empty {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  color: var(--color-gray-dark);
  padding: var(--spacing-md);
  text-align: center;
}

.users-settings__user {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-gray-light);
  background-color: var(--color-white);
}

.users-settings__user:hover {
  background-color: var(--color-gray-light);
}

.users-settings__user-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.users-settings__user-icon img {
  max-width: 16px;
  max-height: 16px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.users-settings__user-name {
  flex: 1;
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
}

.users-settings__current-badge {
  color: var(--color-gray-dark);
  font-style: italic;
}

.users-settings__delete-btn {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  padding: 2px 8px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.users-settings__delete-btn:hover:not(:disabled) {
  background-color: var(--color-gray-light);
}

.users-settings__delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.users-settings__error {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  color: #CC0000;
  padding: var(--spacing-sm);
  background-color: #FFEEEE;
  border: 1px solid #CC0000;
  margin-bottom: var(--spacing-sm);
}

.users-settings__form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.users-settings__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.users-settings__field--row {
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-sm);
}

.users-settings__field label {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
}

.users-settings__stc-status {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
}

.status--connected { color: #008800; font-weight: bold; }
.status--connecting { color: #888800; }
.status--reconnecting { color: #888800; }
.status--error { color: #CC0000; }
.status--disconnected { color: var(--color-gray-dark); }

.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.cursor-pointer { cursor: pointer; }

.users-settings__field input {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
}

.users-settings__field input:disabled {
  background-color: var(--color-gray-light);
}

.users-settings__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-sm);
}

.mac-button {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--color-white);
  border: 2px solid var(--color-black);
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 1px 1px 0 var(--color-black);
}

.mac-button:hover:not(:disabled) {
  background-color: var(--color-gray-light);
}

.mac-button:active:not(:disabled) {
  box-shadow: none;
  transform: translate(1px, 1px);
}

.mac-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
