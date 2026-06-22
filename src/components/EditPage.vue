<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="onCancelEdit" class="btn-ghost">← 返回</button>
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
          <button @click="onCancelEdit" class="btn-ghost">取消</button>
          <button @click="onSaveEditHandler" :disabled="isLoading" class="btn-primary">
            {{ isLoading ? '保存中...' : '保存修改' }}
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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const {
  editPrompt, editForm, isLoading,
  onSaveEditHandler, onCancelEdit
} = inject('appState')

const route = useRoute()

onMounted(async () => {
  if (!editPrompt.value) {
    const id = Number(route.params.id)
    try {
      const res = await axios.get(`${API_BASE}/api/prompts/${id}`)
      editPrompt.value = res.data
      editForm.value = {
        title: res.data.title,
        category: res.data.category,
        content: res.data.content,
        tags: res.data.tags || ''
      }
    } catch (err) {
      console.error('获取提示词失败:', err)
    }
  }
})

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

.error-text {
  color: #E53935;
  font-size: 13px;
}

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

.cat-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
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

.btn-primary:disabled {
  background: #CCC;
  cursor: not-allowed;
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
