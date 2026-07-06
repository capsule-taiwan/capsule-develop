export interface Permission {
  id?: string
  resource: string
  action: string
  description?: string | null
  category?: string | null
  created_at?: string
}

export interface UserRole {
  id: string
  role_id: string
  role?: {
    id: string
    name: string
    description: string | null
    level: number
    is_system: boolean
  }
}
