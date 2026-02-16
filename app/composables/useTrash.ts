/**
 * useTrash Composable
 *
 * Manages the state of the system Trash, including its contents
 * and whether it's empty or full.
 */

import { computed, watch } from 'vue'
import { useDesktop } from '~/composables/useDesktop'
import { useFileSystem } from '~/composables/useFileSystem'
import { useAlert } from '~/composables/useAlert'
import { useSound } from '~/composables/useSound'

export function useTrash() {
  const { updateIcon, icons, removeIcon } = useDesktop()
  const { getTrash, getChildren, moveToTrash: fsMoveToTrash, emptyTrash: fsEmptyTrash, moveNode } = useFileSystem()
  const { playTrashSound } = useSound()

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
   * Empties the trash with a confirmation dialog
   */
  function emptyTrash(): void {
    if (isEmpty.value) return

    const { showAlert } = useAlert()
    const count = items.value.length
    const message = count === 1
      ? 'The Trash contains 1 item. It will be permanently deleted.'
      : `The Trash contains ${count} items. They will be permanently deleted.`

    showAlert({
      message,
      type: 'caution',
      buttons: [
        { label: 'Cancel', value: 'cancel' },
        { label: 'OK', value: 'ok', isDefault: true }
      ],
      onClose: (value) => {
        if (value === 'ok') {
          fsEmptyTrash()
          playTrashSound()
        }
      }
    })
  }

  /**
   * Restores an item from the trash (Put Away)
   */
  function restoreItem(id: string): void {
    const { state, moveNode, updateNode, getNode, getRoot } = useFileSystem()
    const node = state.value.nodes[id]
    
    if (node && node.metadata?.originalParentId) {
      const originalParentId = node.metadata.originalParentId
      // Check if original parent still exists
      const parent = getNode(originalParentId)
      
      if (parent) {
        moveNode(id, originalParentId)
      } else {
        // Fallback: move it back to root
        const root = getRoot()
        moveNode(id, root.id)
      }
      
      // Clear the original parent ID
      const newMetadata = { ...node.metadata }
      delete newMetadata.originalParentId
      updateNode(id, { metadata: newMetadata })
    } else {
      // Fallback: move it back to root
      const root = getRoot()
      moveNode(id, root.id)
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
