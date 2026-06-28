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

export interface Category {
  id: number
  name: string
  transaction_type: 'income' | 'expense'
}

export interface UserSetting {
  start_day: number
  closing_day: number
  week_start: 'sunday' | 'monday'
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

export interface FixedExpense {
  id: number
  name: string
  amount: number
  day: number
  category_id: number
  category: { id: number; name: string }
}

export interface CreateFixedExpenseRequest {
  name: string
  amount: number
  day: number
  category_id: number
}

export interface ScheduledFixedExpense {
  id: number
  name: string
  amount: number
  date: string
  category: { id: number; name: string }
}

export interface GroupMember {
  id: number
  name: string
  role: 'owner' | 'member'
}

export interface Group {
  id: number
  name: string
  members: GroupMember[]
}

export interface Invitation {
  group_name: string
  invited_by: string
  email: string
  expires_at: string
  accepted: boolean
  expired: boolean
}