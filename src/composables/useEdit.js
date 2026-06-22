import { ref } from 'vue'
import { usePrompts } from './usePrompts'
import { useModal } from './useModal'

export function useEdit() {
  const { updatePrompt, fetchPrompts } = usePrompts()
  const { showAlert, showConfirm } = useModal()

  const editPrompt = ref(null)
  const editForm = ref({ title: '', category: '写作', content: '', tags: '' })
  const currentPage = ref('home')

  const startEdit = (prompt) => {
    editPrompt.value = prompt
    editForm.value = {
      title: prompt.title,
      category: prompt.category,
      content: prompt.content,
      tags: prompt.tags || ''
    }
    currentPage.value = 'edit'
  }

  const onSaveEdit = async () => {
    if (!editForm.value.title.trim() || !editForm.value.content.trim()) {
      await showAlert('请填写完整信息', '提示', 'warning')
      return false
    }
    const confirmed = await showConfirm('确定保存修改吗？')
    if (!confirmed) return false

    const success = await updatePrompt(editPrompt.value.id, editForm.value)
    if (success) {
      await showAlert('更新成功！', '成功', 'success')
      editPrompt.value = null
      currentPage.value = 'home'
      await fetchPrompts()
      return true
    }
    return false
  }

  const cancelEdit = () => {
    editPrompt.value = null
    currentPage.value = 'home'
  }

  return {
    editPrompt,
    editForm,
    currentPage,
    startEdit,
    onSaveEdit,
    cancelEdit
  }
}
