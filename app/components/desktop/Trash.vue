<script setup lang="ts">
/**
 * Trash Component
 *
 * A specialized DesktopIcon for the system Trash.
 * Handles drop-to-trash functionality and icon state (empty/full).
 */

import { computed } from 'vue'
import type { DesktopIcon as IDesktopIcon } from '~/types/desktop'
import { useTrash } from '~/composables/useTrash'
import { useDesktop } from '~/composables/useDesktop'
import { useAlert } from '~/composables/useAlert'
import DesktopIcon from './DesktopIcon.vue'

interface Props {
  icon: IDesktopIcon
}

const props = defineProps<Props>()

const { isEmpty, trashIcon, moveToTrash, emptyTrash, items } = useTrash()
const { showContextMenu } = useDesktop()
const { showAlert } = useAlert()

// Override the icon if needed, though useTrash should have updated it in the store
const displayIcon = computed(() => {
  // If the store is already updated, props.icon.icon should be correct
  // But we can be extra sure here
  return props.icon.icon
})

// Handle dropped items
function handleDrop(event: DragEvent) {
  const iconId = event.dataTransfer?.getData('application/x-desktop-icon')
  if (iconId) {
    moveToTrash(iconId)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleContextMenu(event: MouseEvent) {
  showContextMenu(
    { x: event.clientX, y: event.clientY },
    [
      {
        id: 'open-trash',
        label: 'Open',
        action: () => { /* Open trash window */ }
      },
      {
        id: 'empty-trash',
        label: 'Empty Trash...',
        action: () => confirmEmptyTrash(),
        disabled: isEmpty.value
      }
    ]
  )
}

function confirmEmptyTrash() {
  if (isEmpty.value) return

  const itemCount = items.value.length
  const message = `The Trash contains ${itemCount} item${itemCount === 1 ? '' : 's'}. It will be permanently deleted.`

  showAlert({
    message,
    type: 'caution',
    buttons: [
      { label: 'Cancel', value: 'cancel' },
      { label: 'OK', value: 'ok', isDefault: true }
    ],
    onClose: (value) => {
      if (value === 'ok') {
        emptyTrash()
      }
    }
  })
}
</script>

<template>
  <div
    class="trash-wrapper"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <DesktopIcon
      :icon="icon"
      class="trash-icon"
      @contextmenu="handleContextMenu"
    />
  </div>
</template>

<style scoped>
.trash-wrapper {
  display: contents;
}

/* Specific Trash styles if any */
:deep(.desktop-icon__label) {
  /* Trash label is usually not editable, but DesktopIcon already handles isRenaming */
}
</style>
