import { ref, readonly } from 'vue'

interface User {
  id: number;
  username: string;
}

const currentUser = ref<User | null>(null)
const isAuthenticated = ref(false)
const users = ref<User[]>([])

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

  const loginAsGuest = () => {
    currentUser.value = { id: 0, username: 'Guest' }
    isAuthenticated.value = true
    return true
  }

  const logout = () => {
    currentUser.value = null
    isAuthenticated.value = false
  }

  const fetchUsers = async () => {
    try {
      // @ts-ignore
      const response = await $fetch('/api/users') as { users: User[] }
      users.value = response.users
    } catch (e) {
      console.error('Failed to fetch users:', e)
    }
  }

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      // @ts-ignore
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: { username, password }
      })
      await fetchUsers()
      return true
    } catch (e) {
      console.error('Registration failed:', e)
      return false
    }
  }

  const removeUser = async (id: number): Promise<boolean> => {
    try {
      // @ts-ignore
      await $fetch(`/api/users/${id}`, {
        method: 'DELETE'
      })
      await fetchUsers()
      return true
    } catch (e) {
      console.error('Failed to delete user:', e)
      return false
    }
  }

  return {
    currentUser: readonly(currentUser),
    isAuthenticated: readonly(isAuthenticated),
    users: readonly(users),
    login,
    loginAsGuest,
    logout,
    fetchUsers,
    register,
    removeUser
  }
}
