/**
 * useTrash Composable
 *
 * Manages the state of the system Trash, including its contents
 * and whether it's empty or full.
 */

import { computed, watch } from 'vue'
import { useDesktop } from '~/composables/useDesktop'
import { useFileSystem } from '~/composables/useFileSystem'

export function useTrash() {
  const { updateIcon, icons, removeIcon } = useDesktop()
  const { getTrash, getChildren, moveToTrash: fsMoveToTrash, emptyTrash: fsEmptyTrash, moveNode } = useFileSystem()

  const trashFolder = computed(() => getTrash())
  const items = computed(() => trashFolder.value ? getChildren(trashFolder.value.id) : [])

  const isEmpty = computed(() => items.value.length === 0)

  const trashIcon = computed(() =>
    isEmpty.value ? '/assets/icons/system/trash-empty.png' : '/assets/icons/system/trash-full.png'
  )

  // Watch for changes in isEmpty to update desktop icon
  watch(isEmpty, () => {
    updateTrashIconOnDesktop()
  })

  /**
   * Moves an item to the trash
   */
  function moveToTrash(id: string): void {
    fsMoveToTrash(id)

    // If it's on the desktop, remove it from there too
    if (icons.value.some(icon => icon.id === id)) {
      removeIcon(id)
    }
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
    fsEmptyTrash()
  }

  /**
   * Restores an item from the trash (Put Away)
   */
  function restoreItem(id: string): void {
    // For now, move it back to root if we don't know original path
    // In a better implementation, we'd store original parent ID
    const root = getTrash()?.parentId
    if (root) {
      moveNode(id, root)
    }
  }

  return {
    items,
    isEmpty,
    trashIcon,
    moveToTrash,
    emptyTrash,
    restoreItem,
    updateTrashIconOnDesktop
  }
}
