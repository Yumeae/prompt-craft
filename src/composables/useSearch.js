import { ref, watch } from 'vue'

export function useSearch({ fetchPrompts, searchPrompts, getSuggestions, activeCategory, onShowDetail }) {
  const searchText = ref('')
  const suggestions = ref([])
  const showSuggestions = ref(false)
  let isSelecting = false

  let searchTimer = null

  watch(searchText, (newValue) => {
    if (isSelecting) return

    clearTimeout(searchTimer)
    searchTimer = setTimeout(async () => {
      if (newValue.trim()) {
        activeCategory.value = '全部'
        await searchPrompts(newValue)
        const result = await getSuggestions(newValue)
        suggestions.value = result
        showSuggestions.value = result.length > 0
      } else {
        await fetchPrompts()
        suggestions.value = []
        showSuggestions.value = false
      }
    }, 300)
  })

  const selectSuggestion = (item) => {
    isSelecting = true
    showSuggestions.value = false
    searchText.value = ''
    suggestions.value = []

    if (onShowDetail && item.id) {
      onShowDetail(item)
    }

    setTimeout(() => {
      isSelecting = false
    }, 100)
  }

  const hideSuggestions = () => {
    setTimeout(() => {
      showSuggestions.value = false
    }, 200)
  }

  return {
    searchText,
    suggestions,
    showSuggestions,
    selectSuggestion,
    hideSuggestions
  }
}
