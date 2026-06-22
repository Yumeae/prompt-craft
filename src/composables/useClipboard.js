export function useClipboard() {
  const showBubble = (text, isError = false) => {
    const bubble = document.createElement('div')
    bubble.textContent = text
    Object.assign(bubble.style, {
      position: 'fixed',
      padding: '8px 16px',
      background: isError ? '#E53935' : '#1A1A1A',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      zIndex: '9999',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.2s ease'
    })
    document.body.appendChild(bubble)

    const show = (e) => {
      bubble.style.left = `${e.clientX - bubble.offsetWidth / 2}px`
      bubble.style.top = `${e.clientY - bubble.offsetHeight - 12}px`
      bubble.style.opacity = '1'
    }

    const hide = () => {
      bubble.style.opacity = '0'
      setTimeout(() => bubble.remove(), 200)
    }

    return { show, hide }
  }

  const copyToClipboard = async (text, event) => {
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

    if (event) {
      const bubble = showBubble(success ? '已复制到剪贴板！' : '复制失败', !success)
      bubble.show(event)
      setTimeout(() => bubble.hide(), 1500)
    }
  }

  return {
    copyToClipboard
  }
}
