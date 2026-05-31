import apiClient from './client'
import type { AuthResponse } from './types'

export interface SignupRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface LoginRequest {
  email: string
  password: string
}

export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/v1/auth/signup', { user: data })
  return response.data
}

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', { user: data })
  return response.data
}

export const logout = async (): Promise<void> => {
  await apiClient.delete('/api/v1/auth/logout')
}
