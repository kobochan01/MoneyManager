import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '../transactions'
import * as transactionsApi from '@/api/transactions'
import type { Transaction } from '@/api/types'

vi.mock('@/api/transactions')

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  transaction_type: 'expense',
  amount: '3000',
  date: '2026-05-31',
  memo: 'テスト',
  category: { id: 1, name: '食費' },
  user: { id: 1, name: 'kobochan' },
  ...overrides,
})

describe('useTransactionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('fetchTransactions', () => {
    it('成功時にtransactionsがセットされる', async () => {
      const tx = makeTransaction()
      vi.mocked(transactionsApi.getTransactions).mockResolvedValue({
        data: { transactions: [tx] },
      } as any)

      const store = useTransactionStore()
      await store.fetchTransactions()

      expect(store.transactions).toEqual([tx])
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(transactionsApi.getTransactions).mockRejectedValue(new Error('network error'))

      const store = useTransactionStore()
      await store.fetchTransactions()

      expect(store.transactions).toEqual([])
      expect(store.error).toBe('読み込みに失敗しました')
    })
  })

  describe('addTransaction', () => {
    it('成功時に配列の先頭に追加される', async () => {
      const existing = makeTransaction({ id: 1, amount: '1000' })
      const newTx = makeTransaction({ id: 2, amount: '5000' })
      vi.mocked(transactionsApi.createTransaction).mockResolvedValue({
        data: { transaction: newTx },
      } as any)

      const store = useTransactionStore()
      store.transactions = [existing]
      await store.addTransaction({
        transaction_type: 'expense',
        amount: 5000,
        date: '2026-05-31',
        category_name: '食費',
      })

      expect(store.transactions[0]).toEqual(newTx)
      expect(store.transactions[1]).toEqual(existing)
    })
  })

  describe('editTransaction', () => {
    it('成功時に該当要素が更新される', async () => {
      const original = makeTransaction({ id: 1, amount: '3000' })
      const updated = makeTransaction({ id: 1, amount: '4000' })
      vi.mocked(transactionsApi.updateTransaction).mockResolvedValue({
        data: { transaction: updated },
      } as any)

      const store = useTransactionStore()
      store.transactions = [original]
      await store.editTransaction(1, { amount: 4000 })

      expect(store.transactions[0]).toEqual(updated)
    })
  })

  describe('removeTransaction', () => {
    it('成功時に該当要素が除去される', async () => {
      const tx1 = makeTransaction({ id: 1 })
      const tx2 = makeTransaction({ id: 2 })
      vi.mocked(transactionsApi.deleteTransaction).mockResolvedValue({} as any)

      const store = useTransactionStore()
      store.transactions = [tx1, tx2]
      await store.removeTransaction(1)

      expect(store.transactions).toEqual([tx2])
    })
  })

  describe('月ナビゲーション', () => {
    it('初期値は現在の年月', () => {
      const store = useTransactionStore()
      const now = new Date()
      expect(store.currentYear).toBe(now.getFullYear())
      expect(store.currentMonth).toBe(now.getMonth() + 1)
    })

    it('prevMonth()で月が1つ前に戻る', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 5
      store.prevMonth()
      expect(store.currentMonth).toBe(4)
      expect(store.currentYear).toBe(2026)
    })

    it('prevMonth()で1月から前の年12月に戻る', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 1
      store.prevMonth()
      expect(store.currentMonth).toBe(12)
      expect(store.currentYear).toBe(2025)
    })

    it('nextMonth()で月が1つ進む', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 5
      store.nextMonth()
      expect(store.currentMonth).toBe(6)
      expect(store.currentYear).toBe(2026)
    })

    it('nextMonth()で12月から翌年1月に進む', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 12
      store.nextMonth()
      expect(store.currentMonth).toBe(1)
      expect(store.currentYear).toBe(2027)
    })
  })

  describe('monthlyTransactions', () => {
    it('currentYear・currentMonthの月の取引のみ返す', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 5
      store.transactions = [
        makeTransaction({ id: 1, date: '2026-05-10' }),
        makeTransaction({ id: 2, date: '2026-04-20' }),
        makeTransaction({ id: 3, date: '2026-06-01' }),
      ]
      expect(store.monthlyTransactions.length).toBe(1)
      expect(store.monthlyTransactions[0]!.date).toBe('2026-05-10')
    })

    it('monthlyIncomeは当月の収入合計を返す', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 5
      store.transactions = [
        makeTransaction({ id: 1, transaction_type: 'income', amount: '200000', date: '2026-05-07' }),
        makeTransaction({ id: 2, transaction_type: 'income', amount: '50000', date: '2026-04-07' }),
      ]
      expect(store.monthlyIncome).toBe(200000)
    })

    it('monthlyExpenseは当月の支出合計を返す', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 5
      store.transactions = [
        makeTransaction({ id: 1, transaction_type: 'expense', amount: '30000', date: '2026-05-10' }),
        makeTransaction({ id: 2, transaction_type: 'expense', amount: '20000', date: '2026-04-10' }),
      ]
      expect(store.monthlyExpense).toBe(30000)
    })

    it('monthlyBalanceは当月の収入合計から支出合計を引いた値', () => {
      const store = useTransactionStore()
      store.currentYear = 2026
      store.currentMonth = 5
      store.transactions = [
        makeTransaction({ id: 1, transaction_type: 'income', amount: '200000', date: '2026-05-07' }),
        makeTransaction({ id: 2, transaction_type: 'expense', amount: '80000', date: '2026-05-10' }),
      ]
      expect(store.monthlyBalance).toBe(120000)
    })
  })

  describe('計算プロパティ', () => {
    it('totalIncomeは収入の合計を返す', () => {
      const store = useTransactionStore()
      store.transactions = [
        makeTransaction({ transaction_type: 'income', amount: '100000' }),
        makeTransaction({ transaction_type: 'income', amount: '50000' }),
        makeTransaction({ transaction_type: 'expense', amount: '30000' }),
      ]
      expect(store.totalIncome).toBe(150000)
    })

    it('totalExpenseは支出の合計を返す', () => {
      const store = useTransactionStore()
      store.transactions = [
        makeTransaction({ transaction_type: 'income', amount: '100000' }),
        makeTransaction({ transaction_type: 'expense', amount: '30000' }),
        makeTransaction({ transaction_type: 'expense', amount: '20000' }),
      ]
      expect(store.totalExpense).toBe(50000)
    })

    it('balanceは収入合計から支出合計を引いた値を返す', () => {
      const store = useTransactionStore()
      store.transactions = [
        makeTransaction({ transaction_type: 'income', amount: '100000' }),
        makeTransaction({ transaction_type: 'expense', amount: '30000' }),
      ]
      expect(store.balance).toBe(70000)
    })
  })
})
