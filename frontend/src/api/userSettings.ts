import apiClient from './client'
import type { UserSetting } from './types'

export const getUserSettings = () =>
  apiClient.get<UserSetting>('/api/v1/user_settings')

export const updateUserSettings = (data: UserSetting) =>
  apiClient.put<UserSetting>('/api/v1/user_settings', data)
