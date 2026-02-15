<script setup lang="ts">
import { ref } from 'vue'
import { useUser } from '~/composables/useUser'

const { login } = useUser()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter both name and password.'
    return
  }

  error.value = ''
  isLoading.value = true

  const success = await login(username.value, password.value)

  if (!success) {
    error.value = 'Invalid name or password.'
  }

  isLoading.value = false
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
        <div class="input-group flex flex-col gap-xs">
          <label for="username" class="login-label">Name:</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="mac-input"
            @keyup.enter="handleLogin"
          />
        </div>

        <div class="input-group flex flex-col gap-xs">
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
          <button class="mac-button" @click="username = ''; password = ''; error = ''">
            Clear
          </button>
          <button
            class="mac-button mac-button--default"
            :disabled="isLoading"
            @click="handleLogin"
          >
            {{ isLoading ? 'Logging in...' : 'Login' }}
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
</style>
