<script setup lang="ts">
/**
 * MenuDropdown Component
 *
 * Recursive component for rendering Mac OS 7 style menus and submenus.
 */

import { ref } from 'vue'
import type { MenuItem } from '~/types/menu'

interface Props {
  items: MenuItem[]
  isSubmenu?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubmenu: false
})

const emit = defineEmits<{
  'item-click': [item: MenuItem]
}>()

const activeSubmenuId = ref<string | null>(null)

function handleItemMouseEnter(item: MenuItem): void {
  if (item.submenu && item.submenu.length > 0 && !item.disabled) {
    activeSubmenuId.value = item.id
  } else {
    activeSubmenuId.value = null
  }
}

function handleItemClick(item: MenuItem): void {
  if (item.disabled || item.isSeparator) return

  if (item.submenu && item.submenu.length > 0) {
    // If it's a submenu item, we might want to toggle it on mobile,
    // but on desktop it usually opens on hover.
    return
  }

  emit('item-click', item)
}

function handleSubItemClick(item: MenuItem): void {
  emit('item-click', item)
}
</script>

<template>
  <div
    class="menu-dropdown"
    :class="{ 'menu-dropdown--submenu': isSubmenu }"
  >
    <div
      v-for="item in items"
      :key="item.id"
      class="menu-dropdown__item"
      :class="{
        'menu-dropdown__item--separator': item.isSeparator,
        'menu-dropdown__item--disabled': item.disabled,
        'menu-dropdown__item--has-submenu': item.submenu && item.submenu.length > 0,
        'menu-dropdown__item--active': activeSubmenuId === item.id
      }"
      @mouseenter="handleItemMouseEnter(item)"
      @click.stop="handleItemClick(item)"
    >
      <template v-if="!item.isSeparator">
        <div v-if="hasAnyIcon" class="menu-dropdown__icon-container">
          <img v-if="item.icon" :src="item.icon" class="menu-dropdown__icon" alt="" />
        </div>
        <span class="menu-dropdown__check">{{ item.checked ? '✓' : '' }}</span>
        <span class="menu-dropdown__label">{{ item.label }}</span>

        <span v-if="item.shortcut && !(item.submenu && item.submenu.length > 0)" class="menu-dropdown__shortcut">
          {{ item.shortcut }}
        </span>

        <span v-if="item.submenu && item.submenu.length > 0" class="menu-dropdown__arrow">
          ▶
        </span>

        <!-- Nested Submenu -->
        <MenuDropdown
          v-if="activeSubmenuId === item.id && item.submenu && item.submenu.length > 0"
          :items="item.submenu"
          :is-submenu="true"
          @item-click="handleSubItemClick"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  box-shadow: 2px 2px 0 var(--color-black);
  z-index: var(--z-dropdown);
  display: flex;
  flex-direction: column;
}

.menu-dropdown--submenu {
  top: -1px;
  left: 100%;
}

.menu-dropdown__item {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  color: var(--color-black);
  cursor: default;
  white-space: nowrap;
}

.menu-dropdown__item:hover:not(.menu-dropdown__item--separator):not(.menu-dropdown__item--disabled),
.menu-dropdown__item--active {
  background-color: var(--color-black);
  color: var(--color-white);
}

.menu-dropdown__item--separator {
  height: 1px;
  padding: 0;
  margin: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-gray-medium);
}

.menu-dropdown__item--disabled {
  color: var(--color-gray-medium);
}

.menu-dropdown__label {
  flex: 1;
}

.menu-dropdown__check {
  width: 20px;
  display: inline-block;
  font-size: 14px;
}

.menu-dropdown__shortcut {
  margin-left: var(--spacing-lg);
  color: inherit;
  opacity: 0.7;
}

.menu-dropdown__item:hover:not(.menu-dropdown__item--separator):not(.menu-dropdown__item--disabled) .menu-dropdown__shortcut {
  opacity: 1;
}

.menu-dropdown__arrow {
  margin-left: var(--spacing-md);
  font-size: 8px;
}
</style>
