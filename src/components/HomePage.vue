<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <span class="logo-text">PromptCraft</span>
      </div>
      <div class="nav-right">
        <template v-if="currentUser">
          <span class="user-name">{{ currentUser.username }}</span>
          <button @click="$router.push('/create')" class="btn-primary btn-sm">+ 发布</button>
          <button @click="$router.push('/profile')" class="btn-ghost btn-sm">个人中心</button>
          <button @click="onLogout" class="btn-ghost btn-sm">退出</button>
        </template>
        <template v-else>
          <button @click="$router.push('/login')" class="btn-primary btn-sm">登录</button>
        </template>
      </div>
    </header>

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
          :value="searchText"
          @input="onUpdateSearchText($event.target.value)"
          placeholder="搜索提示词..."
          class="search-input"
          @focus="onShowSuggestions"
          @blur="hideSuggestions"
        >
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
          <div
            v-for="item in suggestions"
            :key="item.id"
            class="suggestion-item"
            @mousedown.prevent="selectSuggestion(item)"
          >
            {{ item.title }}
          </div>
        </div>
      </div>
    </section>

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

    <div class="main-content">
      <aside class="sidebar">
        <div class="sidebar-title">分类</div>
        <div
          v-for="cat in categories"
          :key="cat"
          :class="['sidebar-item', { active: activeCategory === cat }]"
          @click="onFilterCategory(cat)"
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
            @click="onFilterCategory(cat)"
          >
            <svg class="sidebar-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path v-if="cat === '我发布的'" d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"></path>
              <path v-else d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path>
            </svg>
            <span>{{ cat }}</span>
          </div>
        </template>
      </aside>

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
            @click="onShowDetail(item)"
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
          <p v-if="activeCategory === '我喜欢的'">还没有点赞的提示词</p>
          <p v-else-if="activeCategory === '我发布的'">还没有发布提示词</p>
          <p v-else>暂无提示词</p>
          <button v-if="activeCategory !== '我喜欢的' && currentUser" @click="$router.push('/create')" class="btn-primary">发布第一条</button>
          <button v-else-if="activeCategory !== '我喜欢的'" @click="$router.push('/login')" class="btn-primary">登录后发布</button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const {
  currentUser, isLoading, stats, searchText, suggestions, showSuggestions,
  filteredPrompts, categories, userCategories, activeCategory,
  onLogout, onFilterCategory, onShowDetail, selectSuggestion, hideSuggestions,
  onUpdateSearchText, onShowSuggestions
} = inject('appState')

const hideEmail = (email) => {
  if (!email) return ''
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
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

<style scoped>
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

.main-content {
  display: flex;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
}

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

.sidebar-svg-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

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
