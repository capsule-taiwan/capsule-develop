/**
 * Database - Supabase schema 的 TypeScript 鏡像（平台區的起點；你加自己的表後用
 *   npx supabase gen types typescript --linked > app/types/database.ts
 * 重新生成，或手動加上你新表的 Row/Insert/Update）。
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Timestamps = { created_at: string; updated_at: string }

export interface Database {
  public: {
    Tables: {
      items: {
        Row: { id: string; owner_id: string; name: string | null; description: string | null; status: string | null; amount: number | null; deleted_at: string | null } & Timestamps
        Insert: { id?: string; owner_id: string; name?: string | null; description?: string | null; status?: string | null; amount?: number | null; deleted_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; owner_id?: string; name?: string | null; description?: string | null; status?: string | null; amount?: number | null; deleted_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      permissions: {
        Row: { id: string; resource: string; action: string; description: string | null; category: string | null; created_at: string }
        Insert: { id?: string; resource: string; action: string; description?: string | null; category?: string | null; created_at?: string }
        Update: { id?: string; resource?: string; action?: string; description?: string | null; category?: string | null; created_at?: string }
        Relationships: []
      }
      roles: {
        Row: { id: string; name: string; description: string | null; level: number; is_system: boolean } & Timestamps
        Insert: { id?: string; name: string; description?: string | null; level?: number; is_system?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; description?: string | null; level?: number; is_system?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      role_permissions: {
        Row: { id: string; role_id: string; permission_id: string; created_at: string }
        Insert: { id?: string; role_id: string; permission_id: string; created_at?: string }
        Update: { id?: string; role_id?: string; permission_id?: string; created_at?: string }
        Relationships: []
      }
      user_roles: {
        Row: { id: string; user_id: string; role_id: string; created_at: string }
        Insert: { id?: string; user_id: string; role_id: string; created_at?: string }
        Update: { id?: string; user_id?: string; role_id?: string; created_at?: string }
        Relationships: []
      }
      user_profiles: {
        Row: { user_id: string; is_active: boolean } & Timestamps
        Insert: { user_id: string; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { user_id?: string; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      list_items: {
        Args: { p_user_id: string; p_search?: string; p_filters?: Json; p_sort_key?: string; p_sort_dir?: string; p_page?: number; p_page_size?: number }
        Returns: Json
      }
      has_permission: { Args: { p_resource: string; p_action: string }; Returns: boolean }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: { resource: string; action: string; description: string | null; category: string | null }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
