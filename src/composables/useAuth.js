import { ref } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || ''

export function useAuth() {
  const currentUser = ref(null)
  const token = ref(null)
  const isLock = ref(false)
  const loginError = ref('')

  // 从 localStorage 恢复登录状态和 JWT Token
  const savedUser = localStorage.getItem('prompt_craft_user')
  const savedToken = localStorage.getItem('prompt_craft_token')
  if (savedUser && savedToken) {
    try {
      currentUser.value = JSON.parse(savedUser)
      token.value = savedToken
    } catch (e) {
      localStorage.removeItem('prompt_craft_user')
      localStorage.removeItem('prompt_craft_token')
    }
  }

  const handleLogin = async (username, password) => {
    if (isLock.value) return false

    try {
      const res = await axios.post(`${API_BASE}/api/login`, { username, password })
      if (res.data.success) {
        currentUser.value = res.data.user
        token.value = res.data.token
        localStorage.setItem('prompt_craft_user', JSON.stringify(res.data.user))
        localStorage.setItem('prompt_craft_token', res.data.token)
        loginError.value = ''
        return true
      } else {
        loginError.value = res.data.message || '登录失败'
        // 防爆破：登录失败后锁定3秒
        isLock.value = true
        setTimeout(() => {
          isLock.value = false
        }, 3000)
        return false
      }
    } catch (err) {
      if (err.response && err.response.status === 429) {
        loginError.value = err.response.data.error || '尝试次数过多，请稍后重试'
        isLock.value = true
        setTimeout(() => { isLock.value = false }, 5000)
      } else {
        loginError.value = '网络错误，请检查后端服务是否启动'
      }
      return false
    }
  }

  const handleLogout = () => {
    currentUser.value = null
    token.value = null
    localStorage.removeItem('prompt_craft_user')
    localStorage.removeItem('prompt_craft_token')
  }

  // 获取 JWT Token（供其他模块使用）
  const getToken = () => {
    return token.value
  }

  // 权限守卫：检查是否已登录
  const checkAuth = () => {
    return currentUser.value !== null && token.value !== null
  }

  return {
    currentUser,
    token,
    isLock,
    loginError,
    handleLogin,
    handleLogout,
    checkAuth,
    getToken
  }
}
