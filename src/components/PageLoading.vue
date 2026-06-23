<template>
  <Transition name="fade">
    <div v-if="visible" class="page-loading">
      <div class="page-loading-content">
        <div class="page-loading-spinner"></div>
        <h1 class="page-loading-logo">PromptCraft</h1>
        <p class="page-loading-text">AI 提示词工场</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  visible: Boolean
})
</script>

<style scoped>
.page-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-page);
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
  border: 3px solid var(--border);
  border-top-color: var(--text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.page-loading-logo {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  font-family: 'PingFang SC', -apple-system, MiSans, sans-serif;
}

.page-loading-text {
  font-size: 14px;
  color: var(--text-muted);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
