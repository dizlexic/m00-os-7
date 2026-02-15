import { ref, readonly } from 'vue'

interface User {
  id: number;
  username: string;
}

const currentUser = ref<User | null>(null)
const isAuthenticated = ref(false)

export function useUser() {
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // @ts-ignore - $fetch is global in Nuxt
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      }) as { user: User }

      currentUser.value = response.user
      isAuthenticated.value = true
      return true
    } catch (e) {
      console.error('Login failed:', e)
      return false
    }
  }

  const logout = () => {
    currentUser.value = null
    isAuthenticated.value = false
  }

  return {
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    login,
    logout
  }
}
