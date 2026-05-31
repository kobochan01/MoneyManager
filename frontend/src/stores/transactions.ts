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
    totalIncome,
    totalExpense,
    balance,
    fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
  }
})
