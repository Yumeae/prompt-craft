import { ref } from 'vue'

export function usePageLoading() {
  const isPageLoading = ref(true)

  const hidePageLoading = () => {
    setTimeout(() => {
      isPageLoading.value = false
    }, 800)
  }

  return {
    isPageLoading,
    hidePageLoading
  }
}
