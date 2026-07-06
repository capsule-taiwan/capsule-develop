/**
 * useItems - items 的 CRUD（範例；你的模組照抄成 use<Mod>）。
 * 每個 method 回 { data, error } 不 throw；insert 時蓋上 owner_id；刪除採軟刪（設 deleted_at）。
 */
import type { ItemInsert, ItemUpdate } from '~/types/items'

export const useItems = () => {
  const supabase = useSupabaseClient()
  const { user } = useAuth()

  const getItem = async (id: string) => {
    if (!user.value) return { data: null, error: { message: '請先登入' } }
    const { data, error } = await supabase.from('items').select('*').eq('id', id).is('deleted_at', null).single()
    if (error) return { data: null, error: { message: error.message || '取得項目失敗' } }
    return { data: JSON.parse(JSON.stringify(data)), error: null }
  }

  const createItem = async (payload: Omit<ItemInsert, 'owner_id'>) => {
    if (!user.value) return { data: null, error: { message: '請先登入' } }
    const { data, error } = await supabase
      .from('items')
      .insert([{ ...payload, owner_id: user.value.id }])
      .select()
      .single()
    if (error) return { data: null, error: { message: error.message || '建立項目失敗' } }
    return { data: JSON.parse(JSON.stringify(data)), error: null }
  }

  const updateItem = async (id: string, payload: ItemUpdate) => {
    if (!user.value) return { data: null, error: { message: '請先登入' } }
    const { data, error } = await supabase.from('items').update(payload).eq('id', id).select().single()
    if (error) return { data: null, error: { message: error.message || '更新項目失敗' } }
    return { data: JSON.parse(JSON.stringify(data)), error: null }
  }

  const deleteItem = async (id: string) => {
    if (!user.value) return { error: { message: '請先登入' } }
    const { error } = await supabase.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return { error: { message: error.message || '刪除項目失敗' } }
    return { error: null }
  }

  return { getItem, createItem, updateItem, deleteItem }
}
