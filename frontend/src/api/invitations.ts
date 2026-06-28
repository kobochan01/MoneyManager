import apiClient from './client'
import type { Invitation } from './types'

export const createInvitation = (email: string) =>
  apiClient.post<{ token: string }>('/api/v1/invitations', { email })

export const getInvitation = (token: string) =>
  apiClient.get<{ invitation: Invitation }>(`/api/v1/invitations/${token}`)

export const acceptInvitation = (token: string) =>
  apiClient.post<{ message: string }>(`/api/v1/invitations/${token}/accept`)
