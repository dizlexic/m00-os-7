<script setup lang="ts">
/**
 * MenuDropdown Component
 *
 * Recursive component for rendering Mac OS 7 style menus and submenus.
 */

import { ref, computed } from 'vue'
import type { MenuItem } from '~/types/menu'
import { useSettings } from '~/composables/useSettings'

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

const { settings } = useSettings()

const activeSubmenuId = ref<string | null>(null)
const blinkingItemId = ref<string | null>(null)
const isBlinkingOn = ref(false)

const hasAnyIcon = computed(() => props.items.some(item => !!item.icon))

function handleItemMouseEnter(item: MenuItem): void {
  if (item.submenu && item.submenu.length > 0 && !item.disabled) {
    activeSubmenuId.value = item.id
  } else {
    activeSubmenuId.value = null
  }
}

async function handleItemClick(item: MenuItem): Promise<void> {
  if (item.disabled || item.isSeparator) return

  if (item.submenu && item.submenu.length > 0) {
    // If it's a submenu item, we might want to toggle it on mobile,
    // but on desktop it usually opens on hover.
    return
  }

  if (settings.value.menuBlinking) {
    blinkingItemId.value = item.id
    // Blink 3 times (on, off, on, off, on, off)
    for (let i = 0; i < 6; i++) {
      isBlinkingOn.value = !isBlinkingOn.value
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    blinkingItemId.value = null
    isBlinkingOn.value = false
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
        'menu-dropdown__item--active': (activeSubmenuId === item.id) || (blinkingItemId === item.id && isBlinkingOn)
      }"
      @mouseenter="handleItemMouseEnter(item)"
      @click.stop="handleItemClick(item)"
    >
      <template v-if="!item.isSeparator">
        <div v-if="hasAnyIcon" class="menu-dropdown__icon-container">
          <img v-if="item.icon" :src="item.icon" class="menu-dropdown__icon" alt="" />
        </div>
        <span class="menu-dropdown__check">{{ item.checked ? '✓' : '' }}</span>

        <div
          v-if="item.color !== undefined"
          class="menu-dropdown__color"
          :class="{ 'menu-dropdown__color--none': item.color === 'transparent' }"
          :style="{ backgroundColor: item.color !== 'transparent' ? item.color : 'transparent' }"
        ></div>

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

.menu-dropdown__icon-container {
  width: 20px;
  height: 20px;
  margin-right: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-dropdown__icon {
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
}

.menu-dropdown__check {
  width: 20px;
  display: inline-block;
  font-size: 14px;
}

.menu-dropdown__color {
  width: 14px;
  height: 10px;
  border: 1px solid var(--color-black);
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
}

.menu-dropdown__item:hover:not(.menu-dropdown__item--separator):not(.menu-dropdown__item--disabled) .menu-dropdown__color,
.menu-dropdown__item--active .menu-dropdown__color {
  border-color: var(--color-white);
}

.menu-dropdown__color--none {
  position: relative;
  background-color: var(--color-white);
}

.menu-dropdown__item:hover:not(.menu-dropdown__item--separator):not(.menu-dropdown__item--disabled) .menu-dropdown__color--none,
.menu-dropdown__item--active .menu-dropdown__color--none {
  background-color: var(--color-black);
}

.menu-dropdown__color--none::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom right, transparent calc(50% - 1px), var(--color-black) 50%, transparent calc(50% + 1px));
}

.menu-dropdown__item:hover:not(.menu-dropdown__item--separator):not(.menu-dropdown__item--disabled) .menu-dropdown__color--none::after,
.menu-dropdown__item--active .menu-dropdown__color--none::after {
  background: linear-gradient(to bottom right, transparent calc(50% - 1px), var(--color-white) 50%, transparent calc(50% + 1px));
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
