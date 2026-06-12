import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFixedExpenseStore } from '../fixedExpenses'
import * as fixedExpensesApi from '@/api/fixedExpenses'
import type { FixedExpense, CreateFixedExpenseRequest } from '@/api/types'

vi.mock('@/api/fixedExpenses')

const makeFixedExpense = (overrides: Partial<FixedExpense> = {}): FixedExpense => ({
  id: 1,
  name: '家賃',
  amount: 80000,
  day: 27,
  category_id: 1,
  category: { id: 1, name: '住居費' },
  ...overrides,
})

describe('useFixedExpenseStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('fetchFixedExpenses', () => {
    it('成功時にfixedExpensesがセットされる', async () => {
      const fe = makeFixedExpense()
      vi.mocked(fixedExpensesApi.getFixedExpenses).mockResolvedValue({
        data: { fixed_expenses: [fe] },
      } as any)

      const store = useFixedExpenseStore()
      await store.fetchFixedExpenses()

      expect(store.fixedExpenses).toEqual([fe])
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(fixedExpensesApi.getFixedExpenses).mockRejectedValue(new Error('network error'))

      const store = useFixedExpenseStore()
      await store.fetchFixedExpenses()

      expect(store.fixedExpenses).toEqual([])
      expect(store.error).toBe('設定の読み込みに失敗しました')
    })
  })

  describe('addFixedExpense', () => {
    it('成功時にfixedExpensesに追加される', async () => {
      const newFe = makeFixedExpense({ id: 2, name: '電気代', amount: 8000 })
      const request: CreateFixedExpenseRequest = { name: '電気代', amount: 8000, day: 10, category_id: 1 }
      vi.mocked(fixedExpensesApi.createFixedExpense).mockResolvedValue({
        data: { fixed_expense: newFe },
      } as any)

      const store = useFixedExpenseStore()
      await store.addFixedExpense(request)

      expect(store.fixedExpenses).toEqual([newFe])
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(fixedExpensesApi.createFixedExpense).mockRejectedValue(new Error('network error'))

      const store = useFixedExpenseStore()
      await store.addFixedExpense({ name: '電気代', amount: 8000, day: 10, category_id: 1 })

      expect(store.error).toBe('設定の保存に失敗しました')
    })
  })

  describe('editFixedExpense', () => {
    it('成功時に該当要素が更新される', async () => {
      const original = makeFixedExpense({ id: 1, amount: 80000 })
      const updated = makeFixedExpense({ id: 1, amount: 85000 })
      vi.mocked(fixedExpensesApi.updateFixedExpense).mockResolvedValue({
        data: { fixed_expense: updated },
      } as any)

      const store = useFixedExpenseStore()
      store.fixedExpenses = [original]
      await store.editFixedExpense(updated)

      expect(store.fixedExpenses[0]).toEqual(updated)
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(fixedExpensesApi.updateFixedExpense).mockRejectedValue(new Error('network error'))

      const store = useFixedExpenseStore()
      store.fixedExpenses = [makeFixedExpense()]
      await store.editFixedExpense(makeFixedExpense())

      expect(store.error).toBe('設定の保存に失敗しました')
    })
  })

  describe('removeFixedExpense', () => {
    it('成功時に該当要素が除去される', async () => {
      const fe1 = makeFixedExpense({ id: 1 })
      const fe2 = makeFixedExpense({ id: 2, name: '電気代' })
      vi.mocked(fixedExpensesApi.deleteFixedExpense).mockResolvedValue({} as any)

      const store = useFixedExpenseStore()
      store.fixedExpenses = [fe1, fe2]
      await store.removeFixedExpense(1)

      expect(store.fixedExpenses).toEqual([fe2])
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(fixedExpensesApi.deleteFixedExpense).mockRejectedValue(new Error('network error'))

      const store = useFixedExpenseStore()
      store.fixedExpenses = [makeFixedExpense()]
      await store.removeFixedExpense(1)

      expect(store.error).toBe('設定の削除に失敗しました')
    })
  })
})
