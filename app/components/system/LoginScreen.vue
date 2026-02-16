<script setup lang="ts">
import { ref } from 'vue'
import { useUser } from '~/composables/useUser'
import { useFileSystem } from '~/composables/useFileSystem'
import { useSettings } from '~/composables/useSettings'

const { login, loginAsGuest, register, setAuthenticatedUser } = useUser()
const { fetchFilesFromServer } = useFileSystem()
const { fetchSettingsFromServer } = useSettings()

// Login mode: 'login' for existing user, 'guest' for guest, 'new' for registration
const loginMode = ref<'login' | 'guest' | 'new'>('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const isLoading = ref(false)
const showGuestConfirmation = ref(false)
const generatedGuestUser = ref<any>(null)

async function handleLogin() {
  if (loginMode.value === 'guest') {
    if (!showGuestConfirmation.value) {
      isLoading.value = true
      const guest = await loginAsGuest()
      isLoading.value = false
      if (guest) {
        generatedGuestUser.value = guest
        showGuestConfirmation.value = true
      } else {
        error.value = 'Failed to create guest session.'
      }
      return
    }

    // Proceed to desktop
    if (generatedGuestUser.value) {
      isLoading.value = true
      await Promise.all([
        fetchFilesFromServer(),
        fetchSettingsFromServer()
      ])
      setAuthenticatedUser(generatedGuestUser.value)
      isLoading.value = false
    }
    return
  }

  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password.'
    return
  }

  error.value = ''
  isLoading.value = true

  let success = false
  if (loginMode.value === 'new') {
    if (password.value !== confirmPassword.value) {
      error.value = 'Passwords do not match.'
      isLoading.value = false
      return
    }
    success = await register(username.value, password.value)
    if (success) {
      success = await login(username.value, password.value)
    } else {
      error.value = 'Registration failed. Username might be taken.'
    }
  } else {
    success = await login(username.value, password.value)
    if (!success) {
      error.value = 'Invalid username or password.'
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

function selectMode(mode: 'login' | 'guest' | 'new') {
  loginMode.value = mode
  error.value = ''
  password.value = ''
  confirmPassword.value = ''
  showGuestConfirmation.value = false
  generatedGuestUser.value = null
  if (mode === 'login') {
    username.value = ''
  }
}

function clearForm() {
  username.value = ''
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
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
        <!-- Login mode selection -->
        <div class="mode-selector">
          <label class="login-label mb-xs block">Login Mode:</label>
          <div class="mode-buttons flex gap-sm">
            <button
              class="mac-button mode-btn"
              :class="{ 'mode-btn--selected': loginMode === 'login' }"
              @click="selectMode('login')"
            >
              Login
            </button>
            <button
              class="mac-button mode-btn"
              :class="{ 'mode-btn--selected': loginMode === 'guest' }"
              @click="selectMode('guest')"
            >
              Guest
            </button>
            <button
              class="mac-button mode-btn"
              :class="{ 'mode-btn--selected': loginMode === 'new' }"
              @click="selectMode('new')"
            >
              Register
            </button>
          </div>
        </div>

        <!-- Username input (shown for login and register modes) -->
        <div v-if="loginMode !== 'guest'" class="input-group flex flex-col gap-xs">
          <label for="username" class="login-label">Username:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="mac-input"
            :placeholder="loginMode === 'new' ? 'Min 3 characters' : 'Enter username'"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Password input (shown for login and register modes) -->
        <div v-if="loginMode !== 'guest'" class="input-group flex flex-col gap-xs">
          <label for="password" class="login-label">Password:</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="mac-input"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Confirm password (shown only for register mode) -->
        <div v-if="loginMode === 'new'" class="input-group flex flex-col gap-xs">
          <label for="confirm-password" class="login-label">Confirm Password:</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            class="mac-input"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Guest mode message -->
        <div v-if="loginMode === 'guest'" class="guest-message">
          <template v-if="!showGuestConfirmation">
            <p>Continue as Guest to explore without saving your data.</p>
          </template>
          <template v-else>
            <p>You will be logged in as:</p>
            <p class="generated-name">{{ generatedGuestUser.username }}</p>
          </template>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="login-actions flex justify-between items-center mt-md">
          <button class="mac-button" @click="clearForm">
            Clear
          </button>
          <button
            class="mac-button mac-button--default"
            :disabled="isLoading"
            @click="handleLogin"
          >
            {{ isLoading ? 'Processing...' : (loginMode === 'new' ? 'Register' : (loginMode === 'guest' ? (showGuestConfirmation ? 'Start' : 'Continue') : 'Login')) }}
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

.mode-selector {
  margin-bottom: var(--spacing-sm);
}

.mode-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.mode-btn {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.mode-btn--selected {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
  border-color: var(--color-highlight);
}

.guest-message {
  padding: var(--spacing-md);
  background-color: var(--color-white);
  border: 1px solid var(--color-gray-dark);
  text-align: center;
  font-size: var(--font-size-sm);
}

.guest-message p {
  margin: 0;
}

.generated-name {
  font-weight: bold;
  margin-top: var(--spacing-xs) !important;
  font-size: var(--font-size-md);
  color: var(--color-highlight);
}

.mb-xs {
  margin-bottom: var(--spacing-xs);
}

.block {
  display: block;
}
</style>
