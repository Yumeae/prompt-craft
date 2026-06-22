<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { usePrompts } from './composables/usePrompts'
import { useModal } from './composables/useModal'
import { usePageLoading } from './composables/usePageLoading'

const { currentUser, isLock, loginError, handleLogin, handleLogout, checkAuth, getToken } = useAuth()
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

// 编辑状态
const editPrompt = ref(null)
const editForm = ref({ title: '', category: '写作', content: '', tags: '' })

const categories = ['全部', '写作', '编程', '绘画', '翻译', '其他']
const userCategories = ['我发布的', '我喜欢的']

const isTitleInvalid = computed(() => newPrompt.value.title.length > 0 && newPrompt.value.title.length < 3)
const isContentInvalid = computed(() => newPrompt.value.content.length > 0 && newPrompt.value.content.length < 10)

const hideEmail = (email) => {
  if (!email) return ''
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
}

const hidePhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

const checkPageAuth = () => {
  if (!checkAuth() && currentPage.value !== 'login') {
    currentPage.value = 'login'
  }
}

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
      // 获取搜索联想
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

const getCategoryIcon = (cat) => {
  const icons = {
    '写作': 'M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z',
    '编程': 'M16 18l6-6-6-6M8 6l-6 6 6 6',
    '绘画': 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z',
    '翻译': 'M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z',
    '其他': 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z'
  }
  return icons[cat] || icons['其他']
}
</script>

<template>
  <!-- 全局加载动画 -->
  <Transition name="fade">
    <div v-if="isPageLoading" class="page-loading">
      <div class="page-loading-content">
        <div class="page-loading-spinner"></div>
        <h1 class="page-loading-logo">PromptCraft</h1>
        <p class="page-loading-text">AI 提示词工场</p>
      </div>
    </div>
  </Transition>

  <!-- 登录页 -->
  <div v-if="currentPage === 'login'" class="login-page">
    <div class="login-container">
      <div class="login-brand">
        <h1 class="login-logo">PromptCraft</h1>
        <p class="login-slogan">AI 提示词工场</p>
      </div>
      <div class="login-form">
        <div class="input-group">
          <input type="text" v-model="loginForm.username" placeholder="用户名" @keyup.enter="onLogin">
        </div>
        <div class="input-group">
          <input type="password" v-model="loginForm.password" placeholder="密码" @keyup.enter="onLogin">
        </div>
        <button @click="onLogin" :disabled="isLock" class="btn-primary btn-full">
          {{ isLock ? '请等待3秒...' : '进入工场' }}
        </button>
        <p v-if="loginError" class="error-text">{{ loginError }}</p>
        <p class="hint-text">测试账号：admin / 123456</p>
      </div>
    </div>
  </div>

  <!-- 主页 -->
  <div v-else-if="currentPage === 'home'" class="app-layout">
    <!-- 顶部导航 -->
    <header class="top-nav">
      <div class="nav-left">
        <span class="logo-text">PromptCraft</span>
      </div>
      <div class="nav-right">
        <template v-if="currentUser">
          <span class="user-name">{{ currentUser.username }}</span>
          <button @click="currentPage = 'create'" class="btn-primary btn-sm">+ 发布</button>
          <button @click="currentPage = 'profile'" class="btn-ghost btn-sm">个人中心</button>
          <button @click="onLogout" class="btn-ghost btn-sm">退出</button>
        </template>
        <template v-else>
          <button @click="currentPage = 'login'" class="btn-primary btn-sm">登录</button>
        </template>
      </div>
    </header>

    <!-- Hero 区域 -->
    <section class="hero-section">
      <h2 class="hero-title">AI 时代，提示词是新的"代码"</h2>
      <p class="hero-subtitle">探索、分享、收藏让 AI 更好为你服务的提示词</p>
      <div class="search-container">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          v-model="searchText"
          placeholder="搜索提示词..."
          class="search-input"
          @focus="showSuggestions = suggestions.length > 0"
          @blur="hideSuggestions"
        >
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
          <div
            v-for="item in suggestions"
            :key="item"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>
    </section>

    <!-- 统计条 -->
    <div class="stats-row">
      <div class="stat-chip">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">提示词</span>
      </div>
      <div class="stat-chip">
        <span class="stat-num">{{ Object.keys(stats.categories).length }}</span>
        <span class="stat-label">分类</span>
      </div>
      <div class="stat-chip">
        <span class="stat-num">{{ stats.topCategory }}</span>
        <span class="stat-label">最热</span>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧分类栏 -->
      <aside class="sidebar">
        <div class="sidebar-title">分类</div>
        <div
          v-for="cat in categories"
          :key="cat"
          :class="['sidebar-item', { active: activeCategory === cat }]"
          @click="filterCategory(cat)"
        >
          <svg class="sidebar-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="getCategoryIcon(cat)"></path>
          </svg>
          <span>{{ cat }}</span>
        </div>

        <template v-if="currentUser">
          <div class="sidebar-divider"></div>
          <div class="sidebar-title">我的</div>
          <div
            v-for="cat in userCategories"
            :key="cat"
            :class="['sidebar-item', { active: activeCategory === cat }]"
            @click="filterCategory(cat)"
          >
            <svg class="sidebar-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="cat === '我发布的'" d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
              <path v-else d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            <span>{{ cat }}</span>
          </div>
        </template>
      </aside>

      <!-- 右侧卡片网格 -->
      <main class="content-area">
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">加载中...</p>
        </div>

        <TransitionGroup v-else name="card-list" tag="div" class="card-grid">
          <div
            v-for="item in filteredPrompts"
            :key="item.id"
            class="prompt-card"
            @click="showDetail(item)"
          >
            <div class="card-category">{{ item.category }}</div>
            <h3 class="card-title">{{ item.title }}</h3>
            <p class="card-desc">{{ item.content.substring(0, 80) }}...</p>
            <div v-if="item.tags" class="card-tags">
              <span v-for="tag in item.tags.split(',').slice(0, 3)" :key="tag" class="card-tag">{{ tag.trim() }}</span>
            </div>
            <div class="card-footer">
              <span class="card-author">{{ hideEmail(item.author_email) }}</span>
              <span class="card-likes">♥ {{ item.likes }}</span>
            </div>
          </div>
        </TransitionGroup>

        <div v-if="!isLoading && filteredPrompts.length === 0" class="empty-state">
          <p>暂无提示词</p>
          <button v-if="currentUser" @click="currentPage = 'create'" class="btn-primary">发布第一条</button>
          <button v-else @click="currentPage = 'login'" class="btn-primary">登录后发布</button>
        </div>
      </main>
    </div>
  </div>

  <!-- 发布页 -->
  <div v-else-if="currentPage === 'create'" class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="goBack" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">发布提示词</span>
      </div>
      <div class="nav-right"></div>
    </header>

    <div class="form-page">
      <div class="form-card">
        <div class="form-group">
          <label class="form-label">标题</label>
          <input type="text" v-model="newPrompt.title" placeholder="给你的提示词起个名字" :class="{ 'input-error': isTitleInvalid }">
          <p v-if="isTitleInvalid" class="error-text">标题至少需要3个字符</p>
        </div>

        <div class="form-group">
          <label class="form-label">分类</label>
          <div class="category-select">
            <label v-for="cat in ['写作', '编程', '绘画', '翻译', '其他']" :key="cat" :class="['cat-option', { selected: newPrompt.category === cat }]">
              <input type="radio" v-model="newPrompt.category" :value="cat" hidden>
              <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="getCategoryIcon(cat)"></path>
              </svg>
              {{ cat }}
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">提示词内容</label>
          <textarea v-model="newPrompt.content" placeholder="在这里写下你的提示词..." rows="6" :class="{ 'input-error': isContentInvalid }"></textarea>
          <p v-if="isContentInvalid" class="error-text">内容至少需要10个字符</p>
        </div>

        <div class="form-group">
          <label class="form-label">标签</label>
          <input type="text" v-model="newPrompt.tags" placeholder="用逗号分隔，如：写作,助手,润色">
        </div>

        <div class="form-group">
          <label class="form-label">联系方式</label>
          <input type="text" :value="currentUser?.email" readonly class="readonly-input">
          <p class="preview-text">
            脱敏预览：{{ hideEmail(currentUser?.email) }}
          </p>
        </div>

        <button @click="onCreatePrompt" :disabled="isLoading" class="btn-primary btn-full">
          {{ isLoading ? '发布中...' : '立即发布' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 编辑页 -->
  <div v-else-if="currentPage === 'edit' && editPrompt" class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="cancelEdit" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">编辑提示词</span>
      </div>
      <div class="nav-right"></div>
    </header>

    <div class="form-page">
      <div class="form-card">
        <div class="form-group">
          <label class="form-label">标题</label>
          <input type="text" v-model="editForm.title" placeholder="给你的提示词起个名字" :class="{ 'input-error': editForm.title.length > 0 && editForm.title.length < 3 }">
          <p v-if="editForm.title.length > 0 && editForm.title.length < 3" class="error-text">标题至少需要3个字符</p>
        </div>

        <div class="form-group">
          <label class="form-label">分类</label>
          <div class="category-select">
            <label v-for="cat in ['写作', '编程', '绘画', '翻译', '其他']" :key="cat" :class="['cat-option', { selected: editForm.category === cat }]">
              <input type="radio" v-model="editForm.category" :value="cat" hidden>
              <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="getCategoryIcon(cat)"></path>
              </svg>
              {{ cat }}
            </label>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">提示词内容</label>
          <textarea v-model="editForm.content" placeholder="在这里写下你的提示词..." rows="6" :class="{ 'input-error': editForm.content.length > 0 && editForm.content.length < 10 }"></textarea>
          <p v-if="editForm.content.length > 0 && editForm.content.length < 10" class="error-text">内容至少需要10个字符</p>
        </div>

        <div class="form-group">
          <label class="form-label">标签</label>
          <input type="text" v-model="editForm.tags" placeholder="用逗号分隔，如：写作,助手,润色">
        </div>

        <div class="form-actions">
          <button @click="cancelEdit" class="btn-ghost">取消</button>
          <button @click="onSaveEdit" :disabled="isLoading" class="btn-primary">
            {{ isLoading ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 详情页 -->
  <div v-else-if="currentPage === 'detail' && currentPrompt" class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="goBack" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">提示词详情</span>
      </div>
      <div class="nav-right"></div>
    </header>

    <div class="detail-page">
      <div class="detail-card">
        <div class="detail-header">
          <span class="detail-category">{{ currentPrompt.category }}</span>
          <h2 class="detail-title">{{ currentPrompt.title }}</h2>
          <div class="detail-meta">
            <span>{{ hideEmail(currentPrompt.author_email) }}</span>
            <span>·</span>
            <span>{{ currentPrompt.created_at }}</span>
          </div>
        </div>

        <div class="detail-body">
          <div class="detail-label">提示词内容</div>
          <div class="detail-content">
            <pre>{{ currentPrompt.content }}</pre>
          </div>
          <button @click="copyContent(currentPrompt.content)" class="btn-primary">一键复制</button>
        </div>

        <div v-if="currentPrompt.tags" class="detail-tags">
          <div class="detail-label">标签</div>
          <div class="tags-list">
            <span v-for="tag in currentPrompt.tags.split(',')" :key="tag" class="tag-item">{{ tag.trim() }}</span>
          </div>
        </div>

        <div class="detail-actions">
          <button @click="onLike(currentPrompt.id)" :class="['btn-like', { liked: isLiked }]">
            <svg v-if="isLiked" class="like-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            <svg v-else class="like-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            <span>{{ currentPrompt.likes }}</span>
          </button>
          <button
            v-if="currentUser && (currentUser.id === currentPrompt.author_id || currentUser.username === 'admin')"
            @click="startEdit(currentPrompt)"
            class="btn-ghost"
          >
            编辑
          </button>
          <button
            v-if="currentUser && (currentUser.id === currentPrompt.author_id || currentUser.username === 'admin')"
            @click="onDelete(currentPrompt.id)"
            class="btn-danger"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 个人中心 -->
  <div v-else-if="currentPage === 'profile' && currentUser" class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="goBack" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">个人中心</span>
      </div>
      <div class="nav-right"></div>
    </header>

    <div class="profile-page">
      <div class="profile-card">
        <h2 class="profile-title">账号信息</h2>
        <div class="profile-info">
          <div class="info-item">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ currentUser.username }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ hideEmail(currentUser.email) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发布数量</span>
            <span class="info-value">{{ myPrompts.length }} 条</span>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <h2 class="profile-title">我的提示词</h2>
        <div v-if="myPrompts.length === 0" class="empty-state">
          <p>你还没有发布过提示词</p>
          <button @click="currentPage = 'create'" class="btn-primary">立即发布</button>
        </div>
        <div v-else class="my-prompts-list">
          <div
            v-for="item in myPrompts"
            :key="item.id"
            class="my-prompt-item"
            @click="showDetail(item)"
          >
            <div class="my-prompt-header">
              <span class="card-category">{{ item.category }}</span>
              <span class="my-prompt-likes">♥ {{ item.likes }}</span>
            </div>
            <h3 class="my-prompt-title">{{ item.title }}</h3>
            <p class="my-prompt-desc">{{ item.content.substring(0, 60) }}...</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 自定义弹窗 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal.visible" class="modal-overlay" @click.self="handleModalCancel">
        <div class="modal-container">
          <div class="modal-header">
            <div :class="['modal-icon', modal.icon]">
              <svg v-if="modal.icon === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
              <svg v-else-if="modal.icon === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <svg v-else-if="modal.icon === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <h3 class="modal-title">{{ modal.title }}</h3>
          </div>
          <div class="modal-body">
            <p class="modal-message">{{ modal.message }}</p>
          </div>
          <div class="modal-footer">
            <button v-if="modal.type === 'confirm'" @click="handleModalCancel" class="btn-ghost">取消</button>
            <button @click="handleModalOk" class="btn-primary">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
/* ==================== Reset & Base ==================== */
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

/* ==================== Page Loading ==================== */
.page-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FAFAFA;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.page-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.page-loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #E5E5E5;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.page-loading-logo {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1A1A1A;
  font-family: 'PingFang SC', -apple-system, MiSans, sans-serif;
}

.page-loading-text {
  font-size: 14px;
  color: #999;
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== Login Page ==================== */
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #FAFAFA;
}

.login-container {
  width: 100%;
  max-width: 360px;
  padding: 40px;
}

.login-brand {
  text-align: center;
  margin-bottom: 48px;
}

.login-logo {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #1A1A1A;
  font-family: 'PingFang SC', -apple-system, MiSans, sans-serif;
}

.login-slogan {
  font-size: 16px;
  color: #999;
  margin-top: 8px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 15px;
  background: #fff;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #1A1A1A;
}

.hint-text {
  text-align: center;
  color: #BBB;
  font-size: 13px;
  margin-top: 8px;
}

.error-text {
  color: #E53935;
  font-size: 13px;
}

/* ==================== Buttons ==================== */
.btn-primary {
  padding: 12px 24px;
  background: #1A1A1A;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn-primary:hover {
  background: #333;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  background: #CCC;
  cursor: not-allowed;
}

.btn-full {
  width: 100%;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 6px;
}

.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  color: #666;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-ghost:hover {
  color: #1A1A1A;
}

.btn-like {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #FFF;
  color: #E53935;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-like:hover {
  border-color: #E53935;
  background: #FFF5F5;
}

.btn-like.liked {
  background: #E53935;
  color: #FFF;
  border-color: #E53935;
}

.btn-like.liked:hover {
  background: #C62828;
}

.like-icon {
  width: 18px;
  height: 18px;
}

.btn-danger {
  padding: 10px 20px;
  background: #FFF;
  color: #999;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  color: #E53935;
  border-color: #E53935;
}

/* ==================== Top Navigation ==================== */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 32px;
  background: #fff;
  border-bottom: 1px solid #F0F0F0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-left, .nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
  letter-spacing: -0.02em;
}

.user-name {
  font-size: 14px;
  color: #666;
}

/* ==================== Hero Section ==================== */
.hero-section {
  text-align: center;
  padding: 60px 32px 40px;
  background: #fff;
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  color: #1A1A1A;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
  font-family: 'PingFang SC', -apple-system, MiSans, sans-serif;
}

.hero-subtitle {
  font-size: 16px;
  color: #999;
  margin-bottom: 32px;
}

.search-container {
  position: relative;
  max-width: 560px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #999;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  font-size: 15px;
  background: #FAFAFA;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #1A1A1A;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* Search Suggestions */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #E5E5E5;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 10;
}

.suggestion-item {
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #F5F5F5;
}

/* ==================== Stats Row ==================== */
.stats-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px 32px;
  background: #fff;
  border-bottom: 1px solid #F0F0F0;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A1A;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

/* ==================== Main Content Layout ==================== */
.main-content {
  display: flex;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

/* Sidebar */
.sidebar {
  width: 200px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 13px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  padding-left: 12px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-item:hover {
  background: #F0F0F0;
  color: #1A1A1A;
}

.sidebar-item.active {
  background: #1A1A1A;
  color: #fff;
}

.sidebar-divider {
  height: 1px;
  background: #E5E5E5;
  margin: 12px 0;
}

/* Sidebar icon styles */
.sidebar-svg-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.cat-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
}

/* Content Area */
.content-area {
  flex: 1;
  min-width: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E5E5E5;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-state p {
  margin-bottom: 16px;
}

/* ==================== Card Grid ==================== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.prompt-card {
  background: #fff;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.prompt-card:hover {
  border-color: #D0D0D0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}

.card-category {
  display: inline-block;
  padding: 2px 10px;
  background: #F5F5F5;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-desc {
  font-size: 13px;
  color: #999;
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.card-tag {
  padding: 2px 8px;
  background: #F0F0F0;
  color: #666;
  border-radius: 4px;
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #F5F5F5;
}

.card-author {
  font-size: 12px;
  color: #BBB;
}

.card-likes {
  font-size: 13px;
  color: #E53935;
}

/* ==================== TransitionGroup Animation ==================== */
.card-list-enter-from,
.card-list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.4s ease;
}

.card-list-move {
  transition: transform 0.4s ease;
}

/* ==================== Form Page ==================== */
.form-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px;
}

.form-card {
  background: #fff;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  font-size: 15px;
  background: #FAFAFA;
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1A1A1A;
  background: #fff;
}

.form-group textarea {
  resize: vertical;
}

.input-error {
  border-color: #E53935 !important;
}

.readonly-input {
  background: #F5F5F5 !important;
  color: #666;
  cursor: not-allowed;
}

.preview-text {
  font-size: 13px;
  color: #4CAF50;
  margin-top: 6px;
}

/* Category Select */
.category-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-option {
  padding: 8px 16px;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}

.cat-option:hover {
  border-color: #1A1A1A;
  color: #1A1A1A;
}

.cat-option.selected {
  background: #1A1A1A;
  border-color: #1A1A1A;
  color: #fff;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* ==================== Detail Page ==================== */
.detail-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
}

.detail-card {
  background: #fff;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  overflow: hidden;
}

.detail-header {
  padding: 32px;
  border-bottom: 1px solid #F0F0F0;
}

.detail-category {
  display: inline-block;
  padding: 4px 12px;
  background: #F5F5F5;
  color: #666;
  border-radius: 4px;
  font-size: 13px;
  margin-bottom: 16px;
}

.detail-title {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  font-family: 'PingFang SC', -apple-system, MiSans, sans-serif;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #999;
}

.detail-body {
  padding: 32px;
}

.detail-label {
  font-size: 13px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.detail-content {
  background: #FAFAFA;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.detail-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
}

.detail-tags {
  padding: 0 32px 24px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  padding: 4px 12px;
  background: #F5F5F5;
  color: #666;
  border-radius: 4px;
  font-size: 13px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding: 24px 32px;
  border-top: 1px solid #F0F0F0;
}

/* ==================== Profile Page ==================== */
.profile-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  background: #fff;
  border: 1px solid #E5E5E5;
  border-radius: 12px;
  padding: 24px;
}

.profile-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F0F0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: #999;
}

.info-value {
  font-size: 14px;
  color: #1A1A1A;
  font-weight: 500;
}

.my-prompts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-prompt-item {
  padding: 16px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.my-prompt-item:hover {
  border-color: #D0D0D0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.my-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.my-prompt-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 6px;
}

.my-prompt-desc {
  font-size: 13px;
  color: #999;
}

.my-prompt-likes {
  font-size: 13px;
  color: #E53935;
}

/* ==================== Modal ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 16px;
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-icon svg {
  width: 24px;
  height: 24px;
}

.modal-icon.success {
  background: #E8F5E9;
  color: #4CAF50;
}

.modal-icon.error {
  background: #FFEBEE;
  color: #E53935;
}

.modal-icon.warning {
  background: #FFF3E0;
  color: #FF9800;
}

.modal-icon.info {
  background: #E3F2FD;
  color: #2196F3;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A1A;
}

.modal-body {
  padding: 0 24px 24px;
}

.modal-message {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #FAFAFA;
  border-top: 1px solid #F0F0F0;
}

/* Modal 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    padding: 16px;
  }

  .sidebar {
    width: 100%;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }

  .sidebar-title {
    display: none;
  }

  .sidebar-item {
    white-space: nowrap;
    padding: 8px 14px;
    font-size: 13px;
  }

  .card-grid {
    grid-template-columns: 1fr;
  }

  .hero-title {
    font-size: 28px;
  }

  .stats-row {
    gap: 16px;
  }
}
</style>
