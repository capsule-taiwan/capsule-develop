// 啟動時初始化登入狀態（讀 session + 監聽變化），確保 middleware 前就緒。
export default defineNuxtPlugin(async () => {
  await useAuth().init()
})
