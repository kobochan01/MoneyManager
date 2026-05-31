import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/api/transactions'
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '@/api/types'

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const currentYear = ref(new Date().getFullYear())
  const currentMonth = ref(new Date().getMonth() + 1) // 1-12

  const totalIncome = computed(() =>
    transactions.value
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const totalExpense = computed(() =>
    transactions.value
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const balance = computed(() => totalIncome.value - totalExpense.value)

  const monthlyTransactions = computed(() => {
    const monthStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}`
    return transactions.value.filter((t) => t.date.startsWith(monthStr))
  })

  const monthlyIncome = computed(() =>
    monthlyTransactions.value
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const monthlyExpense = computed(() =>
    monthlyTransactions.value
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0),
  )

  const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpense.value)

  function prevMonth() {
    if (currentMonth.value === 1) {
      currentYear.value -= 1
      currentMonth.value = 12
    } else {
      currentMonth.value -= 1
    }
  }

  function nextMonth() {
    if (currentMonth.value === 12) {
      currentYear.value += 1
      currentMonth.value = 1
    } else {
      currentMonth.value += 1
    }
  }

  async function fetchTransactions(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await getTransactions()
      transactions.value = res.data.transactions
    } catch {
      error.value = '読み込みに失敗しました'
    } finally {
      loading.value = false
    }
  }

  async function addTransaction(data: CreateTransactionRequest): Promise<void> {
    const res = await createTransaction(data)
    transactions.value.unshift(res.data.transaction)
  }

  async function editTransaction(id: number, data: UpdateTransactionRequest): Promise<void> {
    const res = await updateTransaction(id, data)
    const idx = transactions.value.findIndex((t) => t.id === id)
    if (idx !== -1) {
      transactions.value[idx] = res.data.transaction
    }
  }

  async function removeTransaction(id: number): Promise<void> {
    await deleteTransaction(id)
    transactions.value = transactions.value.filter((t) => t.id !== id)
  }

  return {
    transactions,
    loading,
    error,
    currentYear,
    currentMonth,
    totalIncome,
    totalExpense,
    balance,
    monthlyTransactions,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
    prevMonth,
    nextMonth,
  }
})
