import apiClient from './client'
import type { FixedExpense, CreateFixedExpenseRequest, ScheduledFixedExpense } from './types'

export const getFixedExpenses = () =>
  apiClient.get<{ fixed_expenses: FixedExpense[] }>('/api/v1/fixed_expenses')

export const createFixedExpense = (data: CreateFixedExpenseRequest) =>
  apiClient.post<{ fixed_expense: FixedExpense }>('/api/v1/fixed_expenses', data)

export const updateFixedExpense = (data: FixedExpense) =>
  apiClient.put<{ fixed_expense: FixedExpense }>(`/api/v1/fixed_expenses/${data.id}`, data)

export const deleteFixedExpense = (id: number) =>
  apiClient.delete<{ message: string }>(`/api/v1/fixed_expenses/${id}`)

export const getScheduledFixedExpenses = (year: number, month: number) =>
  apiClient.get<{ scheduled: ScheduledFixedExpense[] }>('/api/v1/fixed_expenses/scheduled', {
    params: { year, month },
  })
