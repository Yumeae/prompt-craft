<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-brand">
        <h1 class="login-logo">PromptCraft</h1>
        <p class="login-slogan">AI 提示词工场</p>
      </div>
      <div class="login-form">
        <div class="input-group">
          <input type="text" v-model="loginForm.username" placeholder="用户名" @keyup.enter="handleLogin">
        </div>
        <div class="input-group">
          <input type="password" v-model="loginForm.password" placeholder="密码" @keyup.enter="handleLogin">
        </div>
        <button @click="handleLogin" :disabled="isLock" class="btn-primary btn-full">
          {{ isLock ? '请等待3秒...' : '进入工场' }}
        </button>
        <p v-if="loginError" class="error-text">{{ loginError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'

const { isLock, loginError, onLogin } = inject('appState')

const loginForm = ref({ username: '', password: '' })

const handleLogin = async () => {
  await onLogin(loginForm.value.username, loginForm.value.password)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-page);
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
  color: var(--text-primary);
  font-family: 'PingFang SC', -apple-system, MiSans, sans-serif;
}

.login-slogan {
  font-size: 16px;
  color: var(--text-muted);
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
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  background: var(--bg-surface);
  transition: border-color 0.2s;
  color: var(--text-primary);
}

.input-group input:focus {
  outline: none;
  border-color: var(--text-primary);
}

.hint-text {
  text-align: center;
  color: var(--text-weak);
  font-size: 13px;
  margin-top: 8px;
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
</style>
