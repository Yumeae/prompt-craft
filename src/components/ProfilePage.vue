<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="onGoBack" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">个人中心</span>
      </div>
      <div class="nav-right">
        <button @click="toggleTheme" class="btn-theme" :title="theme === 'light' ? '切换深色模式' : '切换浅色模式'">
          <svg v-if="theme === 'light'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
      </div>
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
            <div class="info-value-row">
              <button @click="showEmail = !showEmail" class="btn-toggle" :title="showEmail ? '隐藏邮箱' : '显示邮箱'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <template v-if="showEmail">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </template>
                  <template v-else>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="4" y1="4" x2="20" y2="20" stroke-width="2.5"></line>
                  </template>
                </svg>
              </button>
              <span class="info-value">{{ showEmail ? currentUser.email : hideEmail(currentUser.email) }}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="info-label">发布数量</span>
            <span class="info-value">{{ promptList.length }} 条</span>
          </div>
        </div>
      </div>

      <div class="profile-card">
        <h2 class="profile-title">我的提示词</h2>
        <div v-if="promptList.length === 0" class="empty-state">
          <p>你还没有发布过提示词</p>
          <button @click="$router.push('/create')" class="btn-primary">立即发布</button>
        </div>
        <div v-else class="my-prompts-list">
          <div
            v-for="item in promptList"
            :key="item.id"
            class="my-prompt-item"
            @click="onShowDetail(item)"
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
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'

const { currentUser, promptList, theme, onGoBack, onShowDetail, fetchMyPrompts, toggleTheme } = inject('appState')

const showEmail = ref(false)

onMounted(() => {
  fetchMyPrompts()
})

const hideEmail = (email) => {
  if (!email) return ''
  return email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
}
</script>

<style scoped>
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 32px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
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
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.profile-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
}

.profile-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
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
  color: var(--text-muted);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.info-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-toggle {
  padding: 4px 8px;
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover {
  background: var(--bg-hover);
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.empty-state p {
  margin-bottom: 16px;
}

.my-prompts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.my-prompt-item {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.my-prompt-item:hover {
  border-color: var(--border-hover);
  box-shadow: 0 2px 8px var(--shadow);
}

.my-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-category {
  display: inline-block;
  padding: 2px 10px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 12px;
}

.my-prompt-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.my-prompt-desc {
  font-size: 13px;
  color: var(--text-muted);
}

.my-prompt-likes {
  font-size: 13px;
  color: #E53935;
}

.btn-primary {
  padding: 12px 24px;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn-primary:hover {
  background: var(--btn-primary-hover);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-ghost {
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-ghost:hover {
  color: var(--text-primary);
}

.btn-theme {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-theme:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
