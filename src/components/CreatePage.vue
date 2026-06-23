<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="nav-left">
        <button @click="onGoBack" class="btn-ghost">← 返回</button>
      </div>
      <div class="nav-center">
        <span class="logo-text">发布提示词</span>
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
</template>

<script setup>
import { inject } from 'vue'

const {
  currentUser, isLoading, newPrompt, theme,
  isTitleInvalid, isContentInvalid,
  onCreatePrompt, onGoBack, toggleTheme
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

.form-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px;
}

.form-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
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
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  background: var(--bg-input);
  transition: all 0.2s;
  font-family: inherit;
  color: var(--text-primary);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--text-primary);
  background: var(--bg-surface);
}

.form-group textarea {
  resize: vertical;
}

.input-error {
  border-color: #E53935 !important;
}

.readonly-input {
  background: var(--bg-hover) !important;
  color: var(--text-secondary);
  cursor: not-allowed;
}

.preview-text {
  font-size: 13px;
  color: #4CAF50;
  margin-top: 6px;
}

.category-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-option {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.cat-option:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
}

.cat-option.selected {
  background: var(--btn-primary-bg);
  border-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.cat-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
}

.error-text {
  color: #E53935;
  font-size: 13px;
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

.btn-primary:disabled {
  background: var(--btn-disabled);
  cursor: not-allowed;
}

.btn-full {
  width: 100%;
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
