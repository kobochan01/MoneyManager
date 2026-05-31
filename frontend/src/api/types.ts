export interface User {
  id: number
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ErrorResponse {
  error?: string
  errors?: string[]
}

export interface Transaction {
  id: number
  transaction_type: 'income' | 'expense'
  amount: string
  date: string
  memo: string | null
  category: { id: number; name: string }
  user: { id: number; name: string }
}

export interface CreateTransactionRequest {
  transaction_type: 'income' | 'expense'
  amount: number
  date: string
  category_name: string
  memo?: string
}

export interface UpdateTransactionRequest {
  transaction_type?: 'income' | 'expense'
  amount?: number
  date?: string
  memo?: string
}
