/**
 * useTrash Composable
 *
 * Manages the state of the system Trash, including its contents
 * and whether it's empty or full.
 */

import { ref, computed } from 'vue'
import { useDesktop } from '~/composables/useDesktop'

interface TrashItem {
  id: string
  name: string
  type: string
  originalPath: string
  deletedAt: number
}

const items = ref<TrashItem[]>([])

export function useTrash() {
  const { removeIcon, updateIcon, icons } = useDesktop()

  const isEmpty = computed(() => items.value.length === 0)

  const trashIcon = computed(() =>
    isEmpty.value ? '/assets/icons/system/trash-empty.png' : '/assets/icons/system/trash-full.png'
  )

  /**
   * Moves an item to the trash
   */
  function moveToTrash(id: string): void {
    const desktopIcon = icons.value.find(icon => icon.id === id)
    if (!desktopIcon) return

    // Don't trash the trash itself or the hard drive
    if (desktopIcon.type === 'trash' || desktopIcon.type === 'hard-drive') return

    const item: TrashItem = {
      id: desktopIcon.id,
      name: desktopIcon.name,
      type: desktopIcon.type,
      originalPath: desktopIcon.path,
      deletedAt: Date.now()
    }

    items.value.push(item)

    // Remove from desktop
    removeIcon(id)

    // Update trash icon state on desktop
    updateTrashIconOnDesktop()
  }

  /**
   * Updates the trash icon on the desktop to reflect empty/full state
   */
  function updateTrashIconOnDesktop(): void {
    const trashOnDesktop = icons.value.find(icon => icon.type === 'trash')
    if (trashOnDesktop) {
      updateIcon(trashOnDesktop.id, {
        icon: trashIcon.value
      })
    }
  }

  /**
   * Empties the trash
   */
  function emptyTrash(): void {
    items.value = []
    updateTrashIconOnDesktop()
  }

  /**
   * Restores an item from the trash (Put Away)
   */
  function restoreItem(id: string): void {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return

    const item = items.value[index]
    // In a real system we'd restore it to its original path
    // For now, we'll just remove it from trash
    items.value.splice(index, 1)
    updateTrashIconOnDesktop()
  }

  return {
    items: computed(() => items.value),
    isEmpty,
    trashIcon,
    moveToTrash,
    emptyTrash,
    restoreItem,
    updateTrashIconOnDesktop
  }
}
