import { ref } from 'vue'

const theme = ref('light')

const applyTheme = (value) => {
  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
}

export function useTheme() {
  const initTheme = () => {
    const saved = localStorage.getItem('theme')
    if (saved) {
      theme.value = saved
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      theme.value = 'dark'
    }
    applyTheme(theme.value)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', theme.value)
    applyTheme(theme.value)
  }

  const toggleThemeWithAnimation = (event) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const maxR = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    )

    const overlay = document.createElement('div')
    overlay.className = 'theme-transition-overlay'
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:99999;pointer-events:none;
      background:${theme.value === 'light' ? '#1a1a1a' : '#f5f5f5'};
      clip-path:circle(0px at ${cx}px ${cy}px);
    `
    document.body.appendChild(overlay)

    const anim = overlay.animate(
      [
        { clipPath: `circle(0px at ${cx}px ${cy}px)`, easing: 'ease-in' },
        { clipPath: `circle(${maxR * 0.6}px at ${cx}px ${cy}px)`, easing: 'ease-in' },
        { clipPath: `circle(${maxR}px at ${cx}px ${cy}px)` }
      ],
      { duration: 450, easing: 'ease-in', fill: 'forwards' }
    )

    const midpointReached = new Promise(resolve => {
      anim.onfinish = resolve
      setTimeout(resolve, 200)
    })

    setTimeout(() => {
      toggleTheme()
    }, 200)

    midpointReached.then(() => {
      const fadeOut = overlay.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 300, easing: 'ease-out', fill: 'forwards' }
      )
      fadeOut.onfinish = () => overlay.remove()
      setTimeout(() => overlay.remove(), 350)
    })
  }

  return { theme, initTheme, toggleTheme, toggleThemeWithAnimation }
}
