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
import { useAlert } from '~/composables/useAlert'
import { useSettings } from '~/composables/useSettings'

const { users, currentUser, fetchUsers, register, removeUser, updateUserProfile, updateProfile } = useUser()
const { showConfirm } = useAlert()
const { fetchSystemSettings, updateSystemSetting, systemSettings } = useSettings()
const {
  settings: networkSettings,
  updateSettings,
  isConnected,
  connectionState,
  currentSession,
  createSession,
  leaveSession
} = useSharedDesktop()

// View state
const view = ref<'list' | 'detail'>('list')
const editingUser = ref<any>(null)

// Form state
const newUsername = ref('')
const newPassword = ref('')
const editUsername = ref('')
const editRole = ref('user')
const editAvatar = ref('')
const error = ref('')
const isLoading = ref(false)
const sessionName = ref('')

// Profile edit state
const profileUsername = ref(currentUser.value?.username || '')
const profilePassword = ref('')
const profileAvatar = ref(currentUser.value?.avatar || '/assets/icons/system/document.png')
const updateError = ref('')
const updateSuccess = ref(false)

const personalAvatars = [
  { id: 'default', path: '/assets/icons/system/document.png' },
  { id: 'mac', path: '/assets/icons/avatars/avatar-mac.png' },
  { id: 'floppy', path: '/assets/icons/avatars/avatar-floppy.png' },
  { id: 'apple', path: '/assets/icons/avatars/avatar-apple.png' },
]

const availableAvatars = [
  '/assets/icons/system/preferences.png',
  '/assets/icons/system/finder.png',
  '/assets/icons/system/hard-drive.png',
  '/assets/icons/system/application.png',
  '/assets/icons/apps/calculator.png',
  '/assets/icons/apps/notepad.png',
  '/assets/icons/system/help.png'
]

// Computed
const userCount = computed(() => users.value.length)
const stcEnabled = computed({
  get: () => networkSettings.value.enabled,
  set: (val) => updateSettings({ enabled: val })
})

const allowGuestLogin = computed({
  get: () => systemSettings.value.allowGuestLogin,
  set: (val) => updateSystemSetting('allowGuestLogin', val)
})

// Fetch users and settings on mount
onMounted(async () => {
  await Promise.all([
    fetchUsers(),
    fetchSystemSettings()
  ])
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
async function handleDeleteUser(userId: number | string): Promise<void> {
  const confirmed = await showConfirm('Are you sure you want to delete this user?')
  if (!confirmed) return

  isLoading.value = true

  try {
    const success = await removeUser(Number(userId))
    if (success) {
      await fetchUsers()
      if (view.value === 'detail' && editingUser.value?.id === userId) {
        handleBackToList()
      }
    }
  } catch (e) {
    error.value = 'Failed to delete user'
  } finally {
    isLoading.value = false
  }
}

async function handleUpdateProfile() {
  updateError.value = ''
  updateSuccess.value = false
  isLoading.value = true

  try {
    const success = await updateProfile({
      username: profileUsername.value !== currentUser.value?.username ? profileUsername.value : undefined,
      password: profilePassword.value || undefined,
      avatar: profileAvatar.value
    })

    if (success) {
      updateSuccess.value = true
      profilePassword.value = ''
    } else {
      updateError.value = 'Failed to update profile'
    }
  } catch (e) {
    updateError.value = 'Failed to update profile'
  } finally {
    isLoading.value = false
  }
}

function handleSelectUser(user: any) {
  editingUser.value = { ...user }
  editUsername.value = user.username
  editRole.value = user.role || 'user'
  editAvatar.value = user.avatar || ''
  view.value = 'detail'
  error.value = ''
}

function handleBackToList() {
  view.value = 'list'
  editingUser.value = null
  error.value = ''
}

async function handleUpdateUser() {
  if (!editingUser.value) return

  error.value = ''
  isLoading.value = true

  try {
    const success = await updateUserProfile(editingUser.value.id, {
      username: editUsername.value,
      role: editRole.value,
      avatar: editAvatar.value
    })

    if (success) {
      await fetchUsers()
      handleBackToList()
    } else {
      error.value = 'Failed to update user'
    }
  } catch (e) {
    error.value = 'Failed to update user'
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

function getUserAvatar(user: any) {
  return user.avatar || '/assets/icons/system/document.png'
}
</script>

<template>
  <div class="users-settings">
    <!-- List View -->
    <template v-if="view === 'list'">
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
            @click="handleSelectUser(user)"
          >
            <div class="users-settings__user-icon">
              <img :src="user.avatar || '/assets/icons/system/document.png'" alt="" draggable="false" />
            </div>
            <div class="users-settings__user-name">
              {{ user.username }}
              <span v-if="currentUser?.id === user.id" class="users-settings__current-badge">
                (you)
              </span>
              <span v-if="user.role === 'admin'" class="users-settings__admin-badge">
                [Admin]
              </span>
            </div>
            <button
              v-if="canDeleteUser(user.id)"
              :data-testid="`delete-user-${user.id}`"
              class="users-settings__delete-btn"
              :disabled="isLoading"
              @click.stop="handleDeleteUser(user.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

    <!-- My Account Section -->
    <div v-if="currentUser && !currentUser.isGuest" class="users-settings__section">
      <h3 class="users-settings__title">My Account</h3>

      <div v-if="updateError" class="users-settings__error">
        {{ updateError }}
      </div>
      <div v-if="updateSuccess" class="users-settings__success">
        Profile updated successfully!
      </div>

      <div class="users-settings__form">
        <div class="users-settings__field">
          <label>Avatar:</label>
          <div class="users-settings__avatar-selection">
            <div
              v-for="avatar in personalAvatars"
              :key="avatar.id"
              class="users-settings__avatar-option"
              :class="{ 'users-settings__avatar-option--selected': profileAvatar === avatar.path }"
              @click="profileAvatar = avatar.path"
            >
              <img :src="avatar.path" alt="" draggable="false" />
            </div>
          </div>
        </div>

        <div class="users-settings__field">
          <label for="profile-username">Username:</label>
          <input
            id="profile-username"
            v-model="profileUsername"
            type="text"
            class="mac-input"
            :disabled="isLoading"
          />
        </div>

        <div class="users-settings__field">
          <label for="profile-password">New Password:</label>
          <input
            id="profile-password"
            v-model="profilePassword"
            type="password"
            class="mac-input"
            placeholder="Keep current"
            :disabled="isLoading"
          />
        </div>

        <div class="users-settings__actions">
          <button
            class="mac-button"
            :disabled="isLoading"
            @click="handleUpdateProfile"
          >
            Update Profile
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

      <div class="users-settings__section">
        <h3 class="users-settings__title">Guest Access</h3>
        <div class="users-settings__field users-settings__field--row">
          <label for="allow-guest" class="cursor-pointer">Allow guests to log in to this computer:</label>
          <input
            id="allow-guest"
            v-model="allowGuestLogin"
            type="checkbox"
            class="mac-checkbox"
          />
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
    </template>

    <!-- Detail/Edit View -->
    <template v-else-if="view === 'detail' && editingUser">
      <div class="users-settings__section">
        <div class="flex justify-between items-center mb-md">
          <button class="mac-button" @click="handleBackToList">
            &lt; Back to List
          </button>
          <h3 class="users-settings__title mb-0 border-0">User: {{ editingUser.username }}</h3>
        </div>

        <div v-if="error" class="users-settings__error">
          {{ error }}
        </div>

        <div class="users-settings__form">
          <div class="users-settings__field">
            <label for="edit-username">Username:</label>
            <input
              id="edit-username"
              v-model="editUsername"
              type="text"
              class="mac-input"
              :disabled="isLoading"
            />
          </div>

          <div class="users-settings__field">
            <label for="edit-role">Role:</label>
            <select id="edit-role" v-model="editRole" class="mac-input" :disabled="isLoading">
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div class="users-settings__field">
            <label>Select Avatar:</label>
            <div class="avatar-grid">
              <div
                v-for="avatar in availableAvatars"
                :key="avatar"
                class="avatar-option"
                :class="{ 'avatar-option--selected': editAvatar === avatar }"
                @click="editAvatar = avatar"
              >
                <img :src="avatar" alt="" draggable="false" />
              </div>
              <div
                class="avatar-option"
                :class="{ 'avatar-option--selected': editAvatar === '' }"
                @click="editAvatar = ''"
              >
                <div class="avatar-none">None</div>
              </div>
            </div>
          </div>

          <div class="users-settings__actions mt-lg flex justify-between">
            <button
              v-if="canDeleteUser(editingUser.id)"
              class="mac-button"
              style="color: #CC0000"
              :disabled="isLoading"
              @click="handleDeleteUser(editingUser.id)"
            >
              Delete User
            </button>
            <div v-else></div>

            <button
              class="mac-button mac-button--default"
              :disabled="isLoading"
              @click="handleUpdateUser"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </template>
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

.users-settings__success {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  color: #008800;
  padding: var(--spacing-sm);
  background-color: #EEFFEE;
  border: 1px solid #008800;
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

.users-settings__avatar-selection {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs);
}

.users-settings__avatar-option {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-gray-medium);
  padding: 3px;
  background-color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.users-settings__avatar-option:hover {
  background-color: var(--color-gray-light);
}

.users-settings__avatar-option--selected {
  border: 2px solid var(--color-highlight);
  padding: 2px;
}

.users-settings__avatar-option img {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
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

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  background-color: var(--color-gray-light);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-black);
}

.avatar-option {
  width: 40px;
  height: 40px;
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 2px;
}

.avatar-option:hover {
  border-color: var(--color-black);
}

.avatar-option--selected {
  border: 2px solid var(--color-highlight);
  background-color: #EEEFFF;
}

.avatar-option img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}

.avatar-none {
  font-size: 10px;
  text-align: center;
}

.users-settings__admin-badge {
  color: #000088;
  font-weight: bold;
  font-size: 10px;
  margin-left: var(--spacing-xs);
}

.mb-0 { margin-bottom: 0 !important; }
.border-0 { border: 0 !important; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.mt-lg { margin-top: var(--spacing-lg); }

.users-settings__field input,
.users-settings__field select {
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
}

.mac-button--default {
  border-width: 3px;
  font-weight: bold;
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
