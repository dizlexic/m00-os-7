import { ref, readonly } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'

export type ClipboardAction = 'copy' | 'cut'

interface ClipboardItem {
  ids: string[]
  action: ClipboardAction
}

const clipboard = ref<ClipboardItem | null>(null)

export function useClipboard() {
  const { copyNode, moveNode } = useFileSystem()

  const copy = (ids: string[]) => {
    clipboard.value = { ids, action: 'copy' }
  }

  const cut = (ids: string[]) => {
    clipboard.value = { ids, action: 'cut' }
  }

  const clear = () => {
    clipboard.value = null
  }

  const paste = (targetFolderId: string) => {
    if (!clipboard.value) return

    const { ids, action } = clipboard.value

    for (const id of ids) {
      if (action === 'copy') {
        copyNode(id, targetFolderId)
      } else if (action === 'cut') {
        moveNode(id, targetFolderId)
      }
    }

    if (action === 'cut') {
      clear()
    }
  }

  return {
    clipboard: readonly(clipboard),
    copy,
    cut,
    clear,
    paste
  }
}
