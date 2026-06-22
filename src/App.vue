<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { usePrompts } from './composables/usePrompts'
import { useModal } from './composables/useModal'
import { usePageLoading } from './composables/usePageLoading'
import { useSearch } from './composables/useSearch'
import { useEdit } from './composables/useEdit'
import { useClipboard } from './composables/useClipboard'
import PageLoading from './components/PageLoading.vue'
import Modal from './components/Modal.vue'

const router = useRouter()
const { currentUser, isLock, loginError, handleLogin, handleLogout } = useAuth()
const {
  promptList, isLoading, stats,
  fetchPrompts, searchPrompts, createPrompt, likePrompt, deletePrompt,
  getLikeStatus, fetchMyPrompts, fetchLikedPrompts, getSuggestions
} = usePrompts()
const { modal, showAlert, showConfirm, handleModalOk, handleModalCancel } = useModal()
const { isPageLoading, hidePageLoading } = usePageLoading()
const { editPrompt, editForm, startEdit, onSaveEdit, cancelEdit } = useEdit()
const { copyToClipboard } = useClipboard()

const newPrompt = ref({ title: '', category: '写作', content: '', tags: '', contact: '' })
const activeCategory = ref('全部')
const currentPrompt = ref(null)
const isLiked = ref(false)
const likedPromptIds = ref([])

const onShowDetail = async (item) => {
  const fullItem = promptList.value.find(p => p.id === item.id) || item
  currentPrompt.value = fullItem
  router.push(`/detail/${item.id}`)
  isLiked.value = currentUser.value ? await getLikeStatus(item.id) : false
}

const { searchText, suggestions, showSuggestions, selectSuggestion, hideSuggestions } = useSearch({
  fetchPrompts, searchPrompts, getSuggestions, activeCategory, onShowDetail
})

const categories = ['全部', '写作', '编程', '绘画', '翻译', '其他']
const userCategories = ['我发布的', '我喜欢的']

const requireAuth = () => {
  if (!currentUser.value) {
    router.push('/login')
    return false
  }
  return true
}

const isTitleInvalid = computed(() => {
  return newPrompt.value.title.length > 0 && newPrompt.value.title.length < 3
})

const isContentInvalid = computed(() => {
  return newPrompt.value.content.length > 0 && newPrompt.value.content.length < 10
})

const filteredPrompts = computed(() => {
  if (activeCategory.value === '我发布的' && currentUser.value) {
    return promptList.value.filter(p => p.author_id === currentUser.value.id)
  }
  if (activeCategory.value === '我喜欢的') {
    return likedPromptIds.value.map(id => promptList.value.find(p => p.id === id)).filter(Boolean)
  }
  if (activeCategory.value === '全部') {
    return promptList.value
  }
  return promptList.value.filter(p => p.category === activeCategory.value)
})

const myPrompts = computed(() => {
  if (!currentUser.value) return []
  return promptList.value.filter(p => p.author_id === currentUser.value.id)
})

onMounted(async () => {
  await fetchPrompts()
  hidePageLoading()
})

const onLogin = async (username, password) => {
  const success = await handleLogin(username, password)
  if (success) {
    router.push('/')
    fetchPrompts()
  }
}

const onLogout = () => {
  handleLogout()
  router.push('/')
}

const onFilterCategory = async (cat) => {
  activeCategory.value = cat
  if (cat === '我发布的') {
    await fetchMyPrompts()
  } else if (cat === '我喜欢的') {
    const liked = await fetchLikedPrompts()
    if (liked) likedPromptIds.value = liked.map(p => p.id)
  } else {
    await fetchPrompts()
  }
}

const onGoBack = () => {
  currentPrompt.value = null
  router.back()
}

const onCreatePrompt = async () => {
  if (!requireAuth()) return
  if (!newPrompt.value.title.trim() || !newPrompt.value.content.trim()) {
    await showAlert('请填写完整信息', '提示', 'warning')
    return
  }
  const confirmed = await showConfirm('确定发布这条提示词吗？')
  if (!confirmed) return

  const success = await createPrompt({
    title: newPrompt.value.title,
    content: newPrompt.value.content,
    category: newPrompt.value.category,
    tags: newPrompt.value.tags,
    author_id: currentUser.value.id,
    author_name: currentUser.value.username,
    author_email: currentUser.value.email
  })

  if (success) {
    await showAlert('发布成功！', '成功', 'success')
    newPrompt.value = { title: '', category: '写作', content: '', tags: '', contact: '' }
    router.push('/')
  }
}

const onLike = async (id) => {
  if (!requireAuth()) return
  const liked = await likePrompt(id)
  if (liked !== null) {
    isLiked.value = liked
    // 同步更新点赞 ID 列表
    if (liked) {
      if (!likedPromptIds.value.includes(id)) {
        likedPromptIds.value = [...likedPromptIds.value, id]
      }
    } else {
      likedPromptIds.value = likedPromptIds.value.filter(i => i !== id)
    }
  }
  if (currentPrompt.value?.id === id) {
    currentPrompt.value = promptList.value.find(p => p.id === id) || currentPrompt.value
  }
}

const onDelete = async (id) => {
  const confirmed = await showConfirm('确定要删除这条提示词吗？此操作不可撤销。', '警告', 'error')
  if (!confirmed) return

  const success = await deletePrompt(id)
  if (success) {
    await showAlert('删除成功', '成功', 'success')
    currentPrompt.value = null
    router.push('/')
  }
}

const onStartEdit = (prompt) => {
  startEdit(prompt, (page) => router.push(`/${page}`))
}

const onSaveEditHandler = async () => {
  await onSaveEdit((page) => router.push(`/${page}`))
}

const onCancelEdit = () => {
  cancelEdit((page) => router.push(`/${page}`))
}

provide('appState', {
  currentUser,
  isLoading,
  stats,
  promptList,
  searchText,
  suggestions,
  showSuggestions,
  filteredPrompts,
  categories,
  userCategories,
  activeCategory,
  newPrompt,
  editPrompt,
  editForm,
  currentPrompt,
  isLiked,
  myPrompts,
  isTitleInvalid,
  isContentInvalid,
  isLock,
  loginError,
  fetchMyPrompts,
  getLikeStatus,
  onLogin,
  onLogout,
  onFilterCategory,
  onShowDetail,
  onGoBack,
  onCreatePrompt,
  onLike,
  onDelete,
  onStartEdit,
  onSaveEditHandler,
  onCancelEdit,
  copyToClipboard,
  selectSuggestion,
  hideSuggestions,
  onUpdateSearchText: (val) => { searchText.value = val },
  onShowSuggestions: () => { showSuggestions.value = suggestions.value.length > 0 }
})
</script>

<template>
  <PageLoading :visible="isPageLoading" />
  <router-view />
  <Modal
    :modal="modal"
    :handleOk="handleModalOk"
    :handleCancel="handleModalCancel"
  />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #FAFAFA;
  color: #1A1A1A;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
</style>
