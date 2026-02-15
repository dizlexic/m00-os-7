<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUser } from '~/composables/useUser'
import { useAlert } from '~/composables/useAlert'
import { useFileSystem } from '~/composables/useFileSystem'
import { useSettings } from '~/composables/useSettings'

const { login, loginAsGuest, register, fetchUsers, users, removeUser } = useUser()
const { showAlert } = useAlert()
const { fetchFilesFromServer } = useFileSystem()
const { fetchSettingsFromServer } = useSettings()

const selectedUser = ref<string | 'guest' | 'new'>('')
const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const showRegister = ref(false)

onMounted(async () => {
  await fetchUsers()
})

async function handleLogin() {
  if (selectedUser.value === 'guest') {
    loginAsGuest()
    return
  }

  const nameToLogin = selectedUser.value === 'new' ? username.value : selectedUser.value

  if (!nameToLogin || (!password.value && selectedUser.value !== 'guest')) {
    error.value = 'Please enter both name and password.'
    return
  }

  error.value = ''
  isLoading.value = true

  let success = false
  if (selectedUser.value === 'new') {
    success = await register(nameToLogin, password.value)
    if (success) {
      success = await login(nameToLogin, password.value)
    } else {
      error.value = 'Registration failed. Username might be taken.'
    }
  } else {
    success = await login(nameToLogin, password.value)
    if (!success) {
      error.value = 'Invalid password.'
    }
  }

  if (success) {
    await Promise.all([
      fetchFilesFromServer(),
      fetchSettingsFromServer()
    ])
  }

  isLoading.value = false
}

function selectUser(user: string | 'guest' | 'new') {
  selectedUser.value = user
  error.value = ''
  password.value = ''
  if (user !== 'new') {
    username.value = ''
  }
}

async function handleDeleteUser(id: number, name: string) {
  showAlert({
    message: `Are you sure you want to delete user "${name}"?`,
    title: 'Delete User',
    type: 'caution',
    buttons: [
      { label: 'Cancel', value: 'cancel' },
      { label: 'Delete', value: 'delete' }
    ],
    onClose: async (value) => {
      if (value === 'delete') {
        const success = await removeUser(id)
        if (success) {
          if (selectedUser.value === name) {
            selectedUser.value = ''
          }
        } else {
          error.value = 'Failed to delete user.'
        }
      }
    }
  })
}
</script>

<template>
  <div class="login-screen flex items-center justify-center">
    <div class="login-dialog mac-window-shadow">
      <div class="login-header flex flex-col items-center gap-md">
        <div class="mac-os-logo">
          <div class="logo-text">Mac OS 7</div>
        </div>
        <h1 class="welcome-text">Welcome to Macintosh</h1>
      </div>

      <div class="login-content flex flex-col gap-lg">
        <div class="user-list-container">
          <label class="login-label mb-xs block">Select User:</label>
          <div class="user-list mac-inset-border">
            <div
              v-for="user in users"
              :key="user.id"
              class="user-item flex justify-between items-center"
              :class="{ 'user-item--selected': selectedUser === user.username }"
              @click="selectUser(user.username)"
            >
              <span>{{ user.username }}</span>
              <button
                v-if="user.username !== 'Admin'"
                class="delete-user-btn"
                @click.stop="handleDeleteUser(user.id, user.username)"
                title="Delete User"
              >
                ×
              </button>
            </div>
            <div
              class="user-item"
              :class="{ 'user-item--selected': selectedUser === 'guest' }"
              @click="selectUser('guest')"
            >
              Guest
            </div>
            <div
              class="user-item user-item--new"
              :class="{ 'user-item--selected': selectedUser === 'new' }"
              @click="selectUser('new')"
            >
              + New User...
            </div>
          </div>
        </div>

        <div v-if="selectedUser === 'new'" class="input-group flex flex-col gap-xs">
          <label for="username" class="login-label">New Name:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="mac-input"
            placeholder="Min 3 characters"
            @keyup.enter="handleLogin"
          />
        </div>

        <div v-if="selectedUser && selectedUser !== 'guest'" class="input-group flex flex-col gap-xs">
          <label for="password" class="login-label">Password:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="mac-input"
            @keyup.enter="handleLogin"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="login-actions flex justify-between items-center mt-md">
          <button class="mac-button" @click="selectedUser = ''; username = ''; password = ''; error = ''">
            Clear
          </button>
          <button
            class="mac-button mac-button--default"
            :disabled="isLoading || !selectedUser"
            @click="handleLogin"
          >
            {{ isLoading ? 'Processing...' : (selectedUser === 'new' ? 'Register' : 'Login') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--color-gray-medium);
  z-index: var(--z-boot);
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2r9//38gYARiJgYgwAAALAcGBl89S8EAAAAASUVORK5CYII=');
}

.login-dialog {
  width: 320px;
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-black);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.mac-window-shadow {
  box-shadow: 2px 2px 0 var(--color-black);
}

.login-header {
  border-bottom: 1px solid var(--color-gray-dark);
  padding-bottom: var(--spacing-lg);
}

.mac-os-logo {
  width: 64px;
  height: 64px;
  border: 2px solid var(--color-black);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-white);
  box-shadow: 2px 2px 0 var(--color-gray-dark);
}

.logo-text {
  font-weight: bold;
  font-size: var(--font-size-xs);
  text-align: center;
}

.welcome-text {
  font-size: var(--font-size-lg);
  font-weight: bold;
}

.login-label {
  font-weight: bold;
}

.error-message {
  color: var(--color-red);
  font-size: var(--font-size-xs);
  min-height: 1.2em;
}

.mt-md {
  margin-top: var(--spacing-md);
}

.user-list {
  background-color: var(--color-white);
  height: 120px;
  overflow-y: auto;
  border: 1px solid var(--color-black);
}

.user-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  cursor: pointer;
  border-bottom: 1px solid var(--color-gray-light);
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background-color: var(--color-gray-light);
}

.user-item--selected {
  background-color: var(--color-highlight) !important;
  color: var(--color-highlight-text);
}

.user-item--new {
  font-style: italic;
  color: var(--color-gray-dark);
}

.user-item--new.user-item--selected {
  color: var(--color-highlight-text);
}

.delete-user-btn {
  background: none;
  border: none;
  color: var(--color-gray-dark);
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-user-btn:hover {
  color: var(--color-red);
}

.user-item--selected .delete-user-btn {
  color: var(--color-highlight-text);
}

.mac-inset-border {
  border: 1px solid var(--color-black);
  box-shadow: inset 1px 1px 0 var(--color-gray-dark);
}

.mb-xs {
  margin-bottom: var(--spacing-xs);
}

.block {
  display: block;
}
</style>
