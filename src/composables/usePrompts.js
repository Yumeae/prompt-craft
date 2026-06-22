import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

export function usePrompts() {
  const promptList = ref([])
  const isLoading = ref(false)

  // 获取请求头（包含 JWT Token）
  const getAuthHeaders = () => {
    const token = localStorage.getItem('prompt_craft_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // 获取所有提示词
  const fetchPrompts = async () => {
    isLoading.value = true
    try {
      const res = await axios.get(`${API_BASE}/api/prompts`)
      promptList.value = res.data
    } catch (err) {
      // 不向用户暴露后端错误细节
      console.error('获取数据失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 搜索提示词
  const searchPrompts = async (keyword) => {
    isLoading.value = true
    try {
      const res = await axios.get(`${API_BASE}/api/search?q=${encodeURIComponent(keyword)}`)
      promptList.value = res.data
    } catch (err) {
      console.error('搜索失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 发布提示词 - 需要 JWT 认证
  const createPrompt = async (promptData) => {
    isLoading.value = true
    try {
      await axios.post(`${API_BASE}/api/prompts`, promptData, {
        headers: getAuthHeaders()
      })
      await fetchPrompts()
      return true
    } catch (err) {
      console.error('发布失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 点赞/取消点赞 - 需要 JWT 认证
  const likePrompt = async (id) => {
    try {
      const res = await axios.put(`${API_BASE}/api/prompts/${id}/like`, null, {
        headers: getAuthHeaders()
      })
      await fetchPrompts()
      return res.data.liked
    } catch (err) {
      console.error('点赞失败:', err)
      return null
    }
  }

  // 获取点赞状态
  const getLikeStatus = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/api/prompts/${id}/like-status`, {
        headers: getAuthHeaders()
      })
      return res.data.liked
    } catch (err) {
      return false
    }
  }

  // 获取用户发布的提示词
  const fetchMyPrompts = async () => {
    isLoading.value = true
    try {
      const res = await axios.get(`${API_BASE}/api/prompts/mine`, {
        headers: getAuthHeaders()
      })
      promptList.value = res.data
    } catch (err) {
      console.error('获取我的提示词失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 获取用户点赞的提示词
  const fetchLikedPrompts = async () => {
    isLoading.value = true
    try {
      const res = await axios.get(`${API_BASE}/api/prompts/liked`, {
        headers: getAuthHeaders()
      })
      promptList.value = res.data
    } catch (err) {
      console.error('获取点赞提示词失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 删除提示词 - 需要 JWT 认证
  const deletePrompt = async (id) => {
    isLoading.value = true
    try {
      await axios.delete(`${API_BASE}/api/prompts/${id}`, {
        headers: getAuthHeaders()
      })
      await fetchPrompts()
      return true
    } catch (err) {
      console.error('删除失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 编辑提示词 - 需要 JWT 认证
  const updatePrompt = async (id, promptData) => {
    isLoading.value = true
    try {
      await axios.put(`${API_BASE}/api/prompts/${id}`, promptData, {
        headers: getAuthHeaders()
      })
      await fetchPrompts()
      return true
    } catch (err) {
      console.error('更新失败:', err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 搜索联想
  const getSuggestions = async (keyword) => {
    try {
      const res = await axios.get(`${API_BASE}/api/suggestions?q=${encodeURIComponent(keyword)}`)
      return res.data
    } catch (err) {
      console.error('获取联想失败:', err)
      return []
    }
  }

  // computed 统计仪表盘
  const stats = computed(() => {
    const total = promptList.value.length
    const categories = {}
    promptList.value.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1
    })
    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]
    return {
      total,
      categories,
      topCategory: topCategory ? topCategory[0] : '-'
    }
  })

  return {
    promptList,
    isLoading,
    stats,
    fetchPrompts,
    searchPrompts,
    createPrompt,
    likePrompt,
    deletePrompt,
    updatePrompt,
    getLikeStatus,
    fetchMyPrompts,
    fetchLikedPrompts,
    getSuggestions
  }
}
