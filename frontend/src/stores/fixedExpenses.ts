import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getFixedExpenses, createFixedExpense, updateFixedExpense as updateFixedExpenseApi, deleteFixedExpense } from '@/api/fixedExpenses'
import type { FixedExpense, CreateFixedExpenseRequest } from '@/api/types'

export const useFixedExpenseStore = defineStore('fixedExpenses', () => {
  const fixedExpenses = ref<FixedExpense[]>([])
  const error = ref<string | null>(null)

  async function fetchFixedExpenses(): Promise<void> {
    try {
      const response = await getFixedExpenses()
      fixedExpenses.value = response.data.fixed_expenses
      error.value = null
    } catch {
      fixedExpenses.value = []
      error.value = '設定の読み込みに失敗しました'
    }
  }

  async function addFixedExpense(data: CreateFixedExpenseRequest): Promise<void> {
    try {
      const response = await createFixedExpense(data)
      fixedExpenses.value.push(response.data.fixed_expense)
      error.value = null
    } catch {
      error.value = '設定の保存に失敗しました'
    }
  }

  async function editFixedExpense(data: FixedExpense): Promise<void> {
    try {
      const response = await updateFixedExpenseApi(data)
      const index = fixedExpenses.value.findIndex(fe => fe.id === response.data.fixed_expense.id)
      if (index !== -1) fixedExpenses.value[index] = response.data.fixed_expense
      error.value = null
    } catch {
      error.value = '設定の保存に失敗しました'
    }
  }

  async function removeFixedExpense(id: number): Promise<void> {
    try {
      await deleteFixedExpense(id)
      fixedExpenses.value = fixedExpenses.value.filter(fe => fe.id !== id)
      error.value = null
    } catch {
      error.value = '設定の削除に失敗しました'
    }
  }

  return { fixedExpenses, error, fetchFixedExpenses, addFixedExpense, editFixedExpense, removeFixedExpense }
})
