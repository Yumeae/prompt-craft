import { ref } from 'vue'

export function useModal() {
  const modal = ref({
    visible: false,
    type: 'alert',
    title: '',
    message: '',
    icon: 'info',
    resolve: null
  })

  const showAlert = (message, title = '提示', icon = 'info') => {
    return new Promise((resolve) => {
      modal.value = { visible: true, type: 'alert', title, message, icon, resolve }
    })
  }

  const showConfirm = (message, title = '确认', icon = 'warning') => {
    return new Promise((resolve) => {
      modal.value = { visible: true, type: 'confirm', title, message, icon, resolve }
    })
  }

  const handleModalOk = () => {
    if (modal.value.resolve) modal.value.resolve(true)
    modal.value.visible = false
  }

  const handleModalCancel = () => {
    if (modal.value.resolve) modal.value.resolve(false)
    modal.value.visible = false
  }

  return {
    modal,
    showAlert,
    showConfirm,
    handleModalOk,
    handleModalCancel
  }
}
