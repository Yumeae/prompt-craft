<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="onGoBack" class="btn-ghost">← 返回</button>
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

const { currentUser, promptList, onGoBack, onShowDetail, fetchMyPrompts } = inject('appState')

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

.info-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-toggle {
  padding: 4px 8px;
  background: transparent;
  color: #1A1A1A;
  border: 1px solid #E5E5E5;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-toggle:hover {
  background: #F5F5F5;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
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

.card-category {
  display: inline-block;
  padding: 2px 10px;
  background: #F5F5F5;
  color: #666;
  border-radius: 4px;
  font-size: 12px;
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
</style>
