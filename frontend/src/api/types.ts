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
