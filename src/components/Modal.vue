<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal.visible" class="modal-overlay" @click.self="handleCancel">
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
            <button v-if="modal.type === 'confirm'" @click="handleCancel" class="btn-ghost">取消</button>
            <button @click="handleOk" class="btn-primary">确定</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modal: Object,
  handleOk: Function,
  handleCancel: Function
})
</script>

<style scoped>
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
</style>
