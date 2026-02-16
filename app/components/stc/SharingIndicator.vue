<script setup lang="ts">
/**
 * SharingIndicator Component
 *
 * Visual indicator in the menu bar showing STC session status
 * and providing a list of connected users.
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSharedDesktop } from '~/composables/useSharedDesktop'
import { useUser } from '~/composables/useUser'
import type { MenuItem } from '~/types/menu'
import MenuDropdown from '~/components/desktop/MenuDropdown.vue'

const { isInSession, remoteUsersList, userCount, currentSession, leaveSession } = useSharedDesktop()
const { currentUser } = useUser()

const isMenuOpen = ref(false)

const menuItems = computed<MenuItem[]>(() => {
  if (!currentSession.value) return []

  const items: MenuItem[] = [
    { id: 'session-info', label: `Session: ${currentSession.value.name}`, disabled: true },
    { id: 'sep1', label: '', isSeparator: true },
    { id: 'users-header', label: 'Users In Session:', disabled: true },
  ]

  // Add local user
  if (currentUser.value) {
    items.push({
      id: `local-user-${currentUser.value.id}`,
      label: `${currentUser.value.username} (you)`,
      disabled: true
    })
  }

  // Add remote users
  remoteUsersList.value.forEach(user => {
    items.push({
      id: `remote-user-${user.id}`,
      label: user.username,
      disabled: true
    })
  })

  items.push({ id: 'sep2', label: '', isSeparator: true })
  items.push({ id: 'stop-sharing', label: 'Stop Sharing', action: () => leaveSession() })

  return items
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function handleItemClick(item: MenuItem) {
  if (item.action) {
    item.action()
  }
  isMenuOpen.value = false
}

function handleClickOutside() {
  isMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div v-if="isInSession" class="sharing-indicator" @click.stop="toggleMenu">
    <div class="sharing-indicator__content" :class="{ 'sharing-indicator__content--active': isMenuOpen }">
      <img src="/assets/icons/system/sharing-16.png" alt="Sharing" class="sharing-indicator__icon" />
      <span class="sharing-indicator__count">{{ userCount }}</span>
    </div>

    <MenuDropdown
      v-if="isMenuOpen"
      :items="menuItems"
      class="sharing-indicator__dropdown"
      @item-click="handleItemClick"
    />
  </div>
</template>

<style scoped>
.sharing-indicator {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: default;
}

.sharing-indicator__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-sm);
  height: 100%;
}

.sharing-indicator__content:hover,
.sharing-indicator__content--active {
  background-color: var(--color-black);
  color: var(--color-white);
}

.sharing-indicator__content:hover .sharing-indicator__icon,
.sharing-indicator__content--active .sharing-indicator__icon {
  filter: invert(1);
}

.sharing-indicator__icon {
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
}

.sharing-indicator__count {
  font-size: var(--font-size-sm);
  font-weight: bold;
}

.sharing-indicator__dropdown {
  right: 0;
  left: auto;
  top: 100%;
}

:deep(.menu-dropdown) {
  right: 0;
  left: auto;
  min-width: 180px;
}
</style>
