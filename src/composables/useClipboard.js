import { useModal } from './useModal'

export function useClipboard() {
  const { showAlert } = useModal()

  const copyToClipboard = async (text) => {
    let success = false
    try {
      await navigator.clipboard.writeText(text)
      success = true
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        success = document.execCommand('copy')
      } finally {
        document.body.removeChild(ta)
      }
    }
    if (success) {
      await showAlert('已复制到剪贴板！', '成功', 'success')
    } else {
      await showAlert('复制失败，请手动复制', '错误', 'error')
    }
  }

  return {
    copyToClipboard
  }
}
