<script setup lang="ts">
/**
 * ContextMenu Component
 *
 * A wrapper around MenuDropdown specifically for context menus.
 * Handles absolute positioning at the mouse click location.
 */

import { computed, onMounted, onUnmounted } from 'vue'
import MenuDropdown from './MenuDropdown.vue'
import type { Position } from '~/types/desktop'
import type { MenuItem } from '~/types/menu'

interface Props {
  items: MenuItem[]
  position: Position
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'item-click': [item: MenuItem]
  'close': []
}>()

const menuStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${props.position.x}px`,
  top: `${props.position.y}px`,
  zIndex: 'var(--z-dropdown)'
}))

function handleItemClick(item: any): void {
  emit('item-click', item)
  emit('close')
}

function handleClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.context-menu')) {
    emit('close')
  }
}

onMounted(() => {
  // Use a timeout to avoid immediate closing if the click that opened the menu bubbles up
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 0)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="context-menu" :style="menuStyle" @click.stop>
    <MenuDropdown
      :items="items"
      @item-click="handleItemClick"
    />
  </div>
</template>

<style scoped>
.context-menu {
  position: absolute;
  /* Reset MenuDropdown's default relative positioning if any */
}

/* Override MenuDropdown's default top: 100% since we position the container */
:deep(.menu-dropdown) {
  top: 0 !important;
  left: 0 !important;
}
</style>
