import { ref, watch } from 'vue'
import { usePrompts } from './usePrompts'

export function useSearch() {
  const { fetchPrompts, searchPrompts, getSuggestions } = usePrompts()

  const searchText = ref('')
  const suggestions = ref([])
  const showSuggestions = ref(false)

  let searchTimer = null

  watch(searchText, (newValue) => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(async () => {
      if (newValue.trim()) {
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

  const selectSuggestion = (suggestion) => {
    searchText.value = suggestion
    showSuggestions.value = false
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
