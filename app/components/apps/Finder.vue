<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'
import type { FileNode, FolderNode } from '~/types/filesystem'

interface Props {
  folderId: string
}

const props = defineProps<Props>()

const { getChildren, getNode, renameNode, deleteNode, getRoot } = useFileSystem()
const { openWindow } = useWindowManager()

const currentFolderId = ref(props.folderId)
const currentFolder = computed(() => getNode(currentFolderId.value) as FolderNode)
const items = computed(() => getChildren(currentFolderId.value))
const selectedItemId = ref<string | null>(null)

const isRoot = computed(() => currentFolderId.value === getRoot()?.id)

function goUp() {
  if (isRoot.value) return

  const parentId = currentFolder.value?.parentId
  if (parentId) {
    currentFolderId.value = parentId
  }
}

function selectItem(id: string) {
  selectedItemId.value = id
}

function handleDoubleClick(item: FileNode) {
  if (item.type === 'folder') {
    // Open new Finder window for this folder
    openWindow({
      type: 'finder',
      title: item.name,
      icon: '/assets/icons/system/folder-closed.png', // Fallback icon
      data: {
        folderId: item.id
      }
    })
  } else if (item.type === 'application') {
     // TODO: Implement app launching
  } else {
    // TODO: Implement file opening (e.g. SimpleText)
  }
}

function getIcon(item: FileNode) {
  if (item.type === 'folder') return '/assets/icons/system/folder-closed.png'
  if (item.type === 'file') return '/assets/icons/system/document.png'
  if (item.type === 'application') return '/assets/icons/apps/generic.png'
  return '/assets/icons/system/document.png'
}
</script>

<template>
  <div class="finder" @click="selectedItemId = null">
    <div class="finder__header">
      <button
        class="finder__up-button"
        :disabled="isRoot"
        @click.stop="goUp"
        title="Go to parent folder"
      >
        <img src="/assets/icons/ui/scroll-arrow-up.png" alt="Up" v-if="!isRoot" />
      </button>
      <div class="finder__header-info">
        <span class="finder__header-title">{{ currentFolder?.name }}</span>
        <span class="finder__header-count">{{ items.length }} items</span>
      </div>
    </div>

    <div class="finder__content">
      <div
        v-for="item in items"
        :key="item.id"
        class="finder__item"
        :class="{ 'finder__item--selected': selectedItemId === item.id }"
        @click.stop="selectItem(item.id)"
        @dblclick.stop="handleDoubleClick(item)"
      >
        <div class="finder__item-icon">
          <img :src="getIcon(item)" :alt="item.name" draggable="false" />
        </div>
        <div class="finder__item-label">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.finder {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-white);
  user-select: none;
}

.finder__header {
  height: 24px;
  border-bottom: 1px solid var(--color-black);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-sm);
  background-color: var(--color-white);
}

.finder__up-button {
  width: 16px;
  height: 16px;
  margin-right: var(--spacing-sm);
  padding: 0;
  background: none;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.finder__up-button:hover:not(:disabled) {
  border-color: var(--color-black);
  background-color: var(--color-gray-light);
}

.finder__up-button:disabled {
  opacity: 0.3;
  cursor: default;
}

.finder__up-button img {
  width: 12px;
  height: 12px;
  image-rendering: pixelated;
}

.finder__header-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: var(--font-size-sm);
}

.finder__header-title {
  font-weight: bold;
}

.finder__content {
  flex: 1;
  padding: var(--spacing-md);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  grid-gap: var(--spacing-md);
  align-content: start;
  overflow-y: auto;
}

.finder__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  cursor: default;
}

.finder__item-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xs);
}

.finder__item-icon img {
  max-width: 32px;
  max-height: 32px;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.finder__item--selected .finder__item-icon {
  filter: invert(1);
}

.finder__item-label {
  font-size: var(--font-size-sm);
  text-align: center;
  word-wrap: break-word;
  padding: 1px 2px;
}

.finder__item--selected .finder__item-label {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
}
</style>
