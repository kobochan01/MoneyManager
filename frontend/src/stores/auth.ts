import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { signup, login, logout } from '@/api/auth'
import type { User } from '@/api/types'
import type { SignupRequest, LoginRequest } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('auth_token'))

  const isAuthenticated = computed(() => token.value !== null)

  async function signupAction(data: SignupRequest): Promise<void> {
    const response = await signup(data)
    setAuth(response.token, response.user)
  }

  async function loginAction(data: LoginRequest): Promise<void> {
    const response = await login(data)
    setAuth(response.token, response.user)
  }

  async function logoutAction(): Promise<void> {
    try {
      await logout()
    } finally {
      clearAuth()
    }
  }

  function setAuth(newToken: string, newUser: User): void {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('auth_token', newToken)
  }

  function clearAuth(): void {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
  }

  return {
    user,
    token,
    isAuthenticated,
    signupAction,
    loginAction,
    logoutAction,
  }
})
