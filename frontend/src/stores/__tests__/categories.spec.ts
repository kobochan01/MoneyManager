import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCategoryStore } from '../categories'
import * as categoriesApi from '@/api/categories'
import type { Category } from '@/api/types'

vi.mock('@/api/categories')

const makeCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 1,
  name: '食費',
  transaction_type: 'expense',
  ...overrides,
})

describe('useCategoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('fetchCategories', () => {
    it('成功時にcategoriesがセットされる', async () => {
      const category = makeCategory()
      vi.mocked(categoriesApi.getCategories).mockResolvedValue({
        data: { categories: [category] },
      } as any)

      const store = useCategoryStore()
      await store.fetchCategories()

      expect(store.categories).toEqual([category])
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(categoriesApi.getCategories).mockRejectedValue(new Error('network error'))

      const store = useCategoryStore()
      await store.fetchCategories()

      expect(store.categories).toEqual([])
      expect(store.error).toBe('読み込みに失敗しました')
    })
  })
})
