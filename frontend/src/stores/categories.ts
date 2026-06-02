import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getCategories } from '@/api/categories'
import type { Category } from '@/api/types'

export const useCategoryStore = defineStore('categories', () => {
  const categories = ref<Category[]>([])
  const error = ref<string | null>(null)

  async function fetchCategories(): Promise<void> {
    try {
      const response = await getCategories()
      categories.value = response.data.categories
      error.value = null
    } catch {
      categories.value = []
      error.value = '読み込みに失敗しました'
    }
  }

  return { categories, error, fetchCategories }
})
