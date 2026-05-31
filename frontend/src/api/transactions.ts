import apiClient from './client'
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from './types'

export const getTransactions = () =>
  apiClient.get<{ transactions: Transaction[] }>('/api/v1/transactions')

export const createTransaction = (data: CreateTransactionRequest) =>
  apiClient.post<{ transaction: Transaction }>('/api/v1/transactions', { transaction: data })

export const updateTransaction = (id: number, data: UpdateTransactionRequest) =>
  apiClient.put<{ transaction: Transaction }>(`/api/v1/transactions/${id}`, { transaction: data })

export const deleteTransaction = (id: number) =>
  apiClient.delete(`/api/v1/transactions/${id}`)
