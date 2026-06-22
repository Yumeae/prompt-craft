<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from './composables/useAuth'
import { usePrompts } from './composables/usePrompts'
import { useModal } from './composables/useModal'
import { usePageLoading } from './composables/usePageLoading'
import PageLoading from './components/PageLoading.vue'
import Modal from './components/Modal.vue'
import LoginPage from './components/LoginPage.vue'
import HomePage from './components/HomePage.vue'
import CreatePage from './components/CreatePage.vue'
import EditPage from './components/EditPage.vue'
import DetailPage from './components/DetailPage.vue'
import ProfilePage from './components/ProfilePage.vue'

const { currentUser, isLock, loginError, handleLogin, handleLogout, checkAuth } = useAuth()
const { promptList, isLoading, stats, fetchPrompts, searchPrompts, createPrompt, likePrompt, deletePrompt, updatePrompt, getLikeStatus, fetchMyPrompts, fetchLikedPrompts, getSuggestions } = usePrompts()
const { modal, showAlert, showConfirm, handleModalOk, handleModalCancel } = useModal()
const { isPageLoading, hidePageLoading } = usePageLoading()

const currentPage = ref('home')
const loginForm = ref({ username: '', password: '' })
const newPrompt = ref({ title: '', category: '写作', content: '', tags: '', contact: '' })
const activeCategory = ref('全部')
const currentPrompt = ref(null)
const isLiked = ref(false)
const searchText = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)

const editPrompt = ref(null)
const editForm = ref({ title: '', category: '写作', content: '', tags: '' })

const categories = ['全部', '写作', '编程', '绘画', '翻译', '其他']
const userCategories = ['我发布的', '我喜欢的']

const isTitleInvalid = computed(() => newPrompt.value.title.length > 0 && newPrompt.value.title.length < 3)
const isContentInvalid = computed(() => newPrompt.value.content.length > 0 && newPrompt.value.content.length < 10)

onMounted(async () => {
  await fetchPrompts()
  hidePageLoading()
})

const onLogin = async () => {
  const success = await handleLogin(loginForm.value.username, loginForm.value.password)
  if (success) {
    currentPage.value = 'home'
    fetchPrompts()
  }
}

const onLogout = () => {
  handleLogout()
  loginForm.value = { username: '', password: '' }
}

const filterCategory = async (cat) => {
  activeCategory.value = cat
  if (cat === '我发布的') {
    await fetchMyPrompts()
  } else if (cat === '我喜欢的') {
    await fetchLikedPrompts()
  } else {
    await fetchPrompts()
  }
}

const filteredPrompts = computed(() => {
  if (activeCategory.value === '全部' || activeCategory.value === '我发布的' || activeCategory.value === '我喜欢的') {
    return promptList.value
  }
  return promptList.value.filter(p => p.category === activeCategory.value)
})

const myPrompts = computed(() => {
  if (!currentUser.value) return []
  return promptList.value.filter(p => p.author_id === currentUser.value.id)
})

let searchTimer = null
watch(searchText, (newValue) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (newValue.trim()) {
      await searchPrompts(newValue)
      const result = await getSuggestions(newValue)
      suggestions.value = result
      showSuggestions.value = result.length > 0
    } else {
      await fetchPrompts()
      suggestions.value = []
      showSuggestions.value = false
    }
  }, 300)
})

const selectSuggestion = (suggestion) => {
  searchText.value = suggestion
  showSuggestions.value = false
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const showDetail = async (item) => {
  currentPrompt.value = item
  currentPage.value = 'detail'
  if (currentUser.value) {
    isLiked.value = await getLikeStatus(item.id)
  } else {
    isLiked.value = false
  }
}

const goBack = () => {
  currentPage.value = 'home'
  currentPrompt.value = null
}

const onCreatePrompt = async () => {
  if (!currentUser.value) {
    currentPage.value = 'login'
    return
  }
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
    currentPage.value = 'home'
  }
}

const onLike = async (id) => {
  if (!currentUser.value) {
    currentPage.value = 'login'
    return
  }
  const liked = await likePrompt(id)
  if (liked !== null) {
    isLiked.value = liked
  }
  if (currentPrompt.value && currentPrompt.value.id === id) {
    const updated = promptList.value.find(p => p.id === id)
    if (updated) currentPrompt.value = updated
  }
}

const onDelete = async (id) => {
  const confirmed = await showConfirm('确定要删除这条提示词吗？此操作不可撤销。', '警告', 'error')
  if (!confirmed) return
  const success = await deletePrompt(id)
  if (success) {
    await showAlert('删除成功', '成功', 'success')
    currentPage.value = 'home'
    currentPrompt.value = null
  }
}

const startEdit = (prompt) => {
  editPrompt.value = prompt
  editForm.value = {
    title: prompt.title,
    category: prompt.category,
    content: prompt.content,
    tags: prompt.tags || ''
  }
  currentPage.value = 'edit'
}

const onSaveEdit = async () => {
  if (!editForm.value.title.trim() || !editForm.value.content.trim()) {
    await showAlert('请填写完整信息', '提示', 'warning')
    return
  }
  const confirmed = await showConfirm('确定保存修改吗？')
  if (!confirmed) return

  const success = await updatePrompt(editPrompt.value.id, editForm.value)
  if (success) {
    await showAlert('更新成功！', '成功', 'success')
    editPrompt.value = null
    currentPage.value = 'home'
    await fetchPrompts()
  }
}

const cancelEdit = () => {
  editPrompt.value = null
  currentPage.value = 'home'
}

const copyContent = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    await showAlert('已复制到剪贴板！', '成功', 'success')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    await showAlert('已复制到剪贴板！', '成功', 'success')
  }
}
</script>

<template>
  <PageLoading :visible="isPageLoading" />

  <LoginPage
    v-if="currentPage === 'login'"
    :loginForm="loginForm"
    :isLock="isLock"
    :loginError="loginError"
    :onLogin="onLogin"
  />

  <HomePage
    v-else-if="currentPage === 'home'"
    :currentUser="currentUser"
    :stats="stats"
    :searchText="searchText"
    :suggestions="suggestions"
    :showSuggestions="showSuggestions"
    :isLoading="isLoading"
    :filteredPrompts="filteredPrompts"
    :categories="categories"
    :userCategories="userCategories"
    :activeCategory="activeCategory"
    @navigate="(page) => currentPage = page"
    @logout="onLogout"
    @update:searchText="(val) => searchText = val"
    @showSuggestions="showSuggestions = suggestions.length > 0"
    @hideSuggestions="hideSuggestions"
    @selectSuggestion="selectSuggestion"
    @filterCategory="filterCategory"
    @showDetail="showDetail"
  />

  <CreatePage
    v-else-if="currentPage === 'create'"
    :newPrompt="newPrompt"
    :currentUser="currentUser"
    :isLoading="isLoading"
    :isTitleInvalid="isTitleInvalid"
    :isContentInvalid="isContentInvalid"
    @goBack="goBack"
    @create="onCreatePrompt"
  />

  <EditPage
    v-else-if="currentPage === 'edit' && editPrompt"
    :editForm="editForm"
    :isLoading="isLoading"
    @cancelEdit="cancelEdit"
    @saveEdit="onSaveEdit"
  />

  <DetailPage
    v-else-if="currentPage === 'detail' && currentPrompt"
    :currentPrompt="currentPrompt"
    :currentUser="currentUser"
    :isLiked="isLiked"
    @goBack="goBack"
    @copyContent="copyContent"
    @like="onLike"
    @startEdit="startEdit"
    @delete="onDelete"
  />

  <ProfilePage
    v-else-if="currentPage === 'profile' && currentUser"
    :currentUser="currentUser"
    :myPrompts="myPrompts"
    @goBack="goBack"
    @navigate="(page) => currentPage = page"
    @showDetail="showDetail"
  />

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
