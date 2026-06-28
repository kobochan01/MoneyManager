import apiClient from './client'
import type { Group } from './types'

export const getGroup = () =>
  apiClient.get<{ group: Group }>('/api/v1/group')
