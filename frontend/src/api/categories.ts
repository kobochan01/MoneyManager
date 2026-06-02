import apiClient from './client'
import type { Category } from './types'

export const getCategories = () =>
  apiClient.get<{ categories: Category[] }>('/api/v1/categories')
