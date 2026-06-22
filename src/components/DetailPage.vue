<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="onGoBack" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">提示词详情</span>
      </div>
      <div class="nav-right"></div>
    </header>

    <div class="detail-page" v-if="currentPrompt">
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
          <button @click="copyToClipboard(currentPrompt.content, $event)" class="btn-primary">一键复制</button>
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
            @click="onStartEdit(currentPrompt)"
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
</template>

<script setup>
import { inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const {
  currentPrompt, currentUser, isLiked, promptList,
  onGoBack, copyToClipboard, onLike, onStartEdit, onDelete, getLikeStatus
} = inject('appState')

const route = useRoute()

onMounted(async () => {
  const id = Number(route.params.id)
  // 如果 currentPrompt 为空（直接访问 URL），从 promptList 或 API 获取
  if (!currentPrompt.value || currentPrompt.value.id !== id) {
    const found = promptList.value.find(p => p.id === id)
    if (found) {
      currentPrompt.value = found
    } else {
      try {
        const res = await axios.get(`${API_BASE}/api/prompts/${id}`)
        currentPrompt.value = res.data
      } catch (err) {
        console.error('获取提示词失败:', err)
      }
    }
  }
  // 初始化点赞状态
  if (currentUser.value && currentPrompt.value) {
    isLiked.value = await getLikeStatus(id)
  }
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
</style>
