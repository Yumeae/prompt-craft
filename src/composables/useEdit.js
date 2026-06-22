import { ref } from 'vue'
import { usePrompts } from './usePrompts'
import { useModal } from './useModal'

export function useEdit() {
  const { updatePrompt, fetchPrompts } = usePrompts()
  const { showAlert, showConfirm } = useModal()

  const editPrompt = ref(null)
  const editForm = ref({ title: '', category: '写作', content: '', tags: '' })

  const startEdit = (prompt, navigateTo) => {
    editPrompt.value = prompt
    editForm.value = {
      title: prompt.title,
      category: prompt.category,
      content: prompt.content,
      tags: prompt.tags || ''
    }
    if (navigateTo) navigateTo('edit/' + prompt.id)
  }

  const onSaveEdit = async (navigateTo) => {
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
      if (navigateTo) navigateTo('/')
      await fetchPrompts()
      return true
    }
    return false
  }

  const cancelEdit = (navigateTo) => {
    editPrompt.value = null
    if (navigateTo) navigateTo('/')
  }

  return {
    editPrompt,
    editForm,
    startEdit,
    onSaveEdit,
    cancelEdit
  }
}
