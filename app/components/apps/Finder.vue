<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'
import { useRecentItems } from '~/composables/useRecentItems'
import { useDesktop } from '~/composables/useDesktop'
import { useTrash } from '~/composables/useTrash'
import type { FileNode, FolderNode } from '~/types/filesystem'

interface Props {
  folderId: string
  windowId?: string
}

const props = defineProps<Props>()

const {
  getChildren,
  getNode,
  renameNode,
  deleteNode,
  getRoot,
  getPathNodes,
  moveToTrash,
  createFolder
} = useFileSystem()
const { openWindow, updateWindow } = useWindowManager()
const { addRecentDoc } = useRecentItems()
const { showContextMenu } = useDesktop()
const { restoreItem } = useTrash()

const currentFolderId = ref(props.folderId)

// Watch for prop changes (e.g. from Go to Folder)
watch(() => props.folderId, (newId) => {
  if (newId && newId !== currentFolderId.value) {
    currentFolderId.value = newId
    selectedItemId.value = null
  }
})

const currentFolder = computed(() => getNode(currentFolderId.value) as FolderNode)
const items = computed(() => getChildren(currentFolderId.value))
const selectedItemId = ref<string | null>(null)
const isRenamingId = ref<string | null>(null)
const editingName = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const pathNodes = computed(() => getPathNodes(currentFolderId.value))

watch(selectedItemId, (newId) => {
  if (props.windowId) {
    updateWindow(props.windowId, {
      data: {
        folderId: currentFolderId.value,
        selectedItemId: newId
      }
    })
  }
})

type ViewMode = 'icon' | 'list'
const viewMode = ref<ViewMode>('icon')

const isRoot = computed(() => currentFolderId.value === getRoot()?.id)

function toggleViewMode() {
  viewMode.value = viewMode.value === 'icon' ? 'list' : 'icon'
}

function goUp() {
  if (isRoot.value) return

  const parentId = currentFolder.value?.parentId
  if (parentId) {
    navigateTo(parentId)
  }
}

function navigateTo(id: string) {
  currentFolderId.value = id
  selectedItemId.value = null

  if (props.windowId) {
    const node = getNode(id)
    if (node) {
      updateWindow(props.windowId, {
        title: node.name,
        data: {
          ...getNode(id), // Include all node data just in case
          folderId: id
        }
      })
    }
  }
}

function selectItem(id: string) {
  selectedItemId.value = id
  // Reset renaming if we select a different item
  if (isRenamingId.value && isRenamingId.value !== id) {
    cancelRename()
  }
}

function handleLabelClick(item: FileNode) {
  // If already selected, start renaming after a delay (similar to Mac OS 7)
  if (selectedItemId.value === item.id && isRenamingId.value !== item.id) {
    setTimeout(() => {
      if (selectedItemId.value === item.id) {
        startRename(item)
      }
    }, 500)
  }
}

function startRename(item: FileNode) {
  if (item.isSystem) return // Don't allow renaming system folders

  isRenamingId.value = item.id
  editingName.value = item.name

  nextTick(() => {
    const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value
    if (el) {
      el.focus()
      el.select()
    }
  })
}

function finishRename() {
  if (isRenamingId.value && editingName.value.trim()) {
    renameNode(isRenamingId.value, editingName.value.trim())
  }
  isRenamingId.value = null
}

function cancelRename() {
  isRenamingId.value = null
}

function deleteSelectedItem() {
  if (selectedItemId.value) {
    const item = getNode(selectedItemId.value)
    if (item && !item.isSystem) {
      moveToTrash(selectedItemId.value)
      selectedItemId.value = null
    }
  }
}

function createNewFolder() {
  const name = 'untitled folder'
  let finalName = name
  let counter = 1

  const existingNames = items.value.map(i => i.name)
  while (existingNames.includes(finalName)) {
    finalName = `${name} ${++counter}`
  }

  const newFolder = createFolder(finalName, currentFolderId.value)
  selectedItemId.value = newFolder.id
  startRename(newFolder)
}

function handleRenameKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    finishRename()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelRename()
  }
}

function handleGlobalKeyDown(event: KeyboardEvent) {
  if (props.windowId) {
    const { activeWindow } = useWindowManager()
    if (activeWindow.value?.id !== props.windowId) return
  }

  // If renaming, handleRenameKeyDown takes over
  if (isRenamingId.value) return

  if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
    return
  }

  switch (event.key) {
    case 'ArrowRight':
      event.preventDefault()
      selectNextItem(1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      selectNextItem(-1)
      break
    case 'ArrowDown':
      event.preventDefault()
      selectNextItem(viewMode.value === 'icon' ? 4 : 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectNextItem(viewMode.value === 'icon' ? -4 : -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedItemId.value) {
        const item = getNode(selectedItemId.value)
        if (item) handleDoubleClick(item)
      }
      break
  }
}

function selectNextItem(delta: number) {
  if (items.value.length === 0) return

  let index = items.value.findIndex(i => i.id === selectedItemId.value)
  if (index === -1) {
    index = delta >= 0 ? 0 : items.value.length - 1
  } else {
    index = (index + delta + items.value.length) % items.value.length
  }

  selectedItemId.value = items.value[index].id
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown)
})

function handleDoubleClick(item: FileNode) {
  if (item.type === 'folder') {
    if (item.name === 'Control Panels' && item.isSystem) {
      openWindow({
        type: 'control-panels',
        title: 'Control Panels',
        icon: '/assets/icons/system/preferences.png',
        width: 400,
        height: 300
      })
    } else {
      // Open new Finder window for this folder
      openWindow({
        type: 'finder',
        title: item.name,
        icon: '/assets/icons/system/folder.png', // Fallback icon
        data: {
          folderId: item.id
        }
      })
    }
  } else if (item.type === 'application') {
    if (item.name === 'SimpleText') {
      openWindow({
        type: 'simpletext',
        title: 'Untitled',
        icon: '/assets/icons/apps/simpletext.png'
      })
    } else if (item.name === 'Calculator') {
      openWindow({
        type: 'calculator',
        title: 'Calculator',
        icon: '/assets/icons/apps/calculator.png',
        width: 178,
        height: 280,
        resizable: false,
        maximizable: false
      })
    } else if (item.name === 'NotePad') {
      openWindow({
        type: 'notepad',
        title: 'Note Pad',
        icon: '/assets/icons/apps/notepad.png',
        width: 300,
        height: 400,
        resizable: true,
        maximizable: false
      })
    }
  } else if (item.type === 'file' || item.type === 'markdown' || item.type === 'image') {
    // Track recent doc
    addRecentDoc({
      id: item.id,
      name: item.name,
      type: 'file',
      icon: getIcon(item),
      data: {
        fileId: item.id
      }
    })

    // Open file in appropriate app
    const typeToWindow: Record<string, any> = {
      'file': 'simpletext',
      'markdown': 'simpletext',
      'image': 'imageviewer'
    }

    openWindow({
      type: typeToWindow[item.type] || 'simpletext',
      title: item.name,
      icon: getIcon(item),
      data: {
        fileId: item.id
      }
    })
  }
}

function getIcon(item: FileNode) {
  if (item.icon) {
    if (item.type === 'application') return `/assets/icons/apps/${item.icon}.png`
    return `/assets/icons/system/${item.icon}.png`
  }
  if (item.type === 'folder') return '/assets/icons/system/folder.png'
  if (item.type === 'file' || item.type === 'markdown' || item.type === 'image') return '/assets/icons/system/document.png'
  if (item.type === 'application') {
    // Try to match common application names if no icon specified
    const name = item.name.toLowerCase()
    if (name.includes('calculator')) return '/assets/icons/apps/calculator.png'
    if (name.includes('notepad')) return '/assets/icons/apps/notepad.png'
    if (name.includes('simpletext')) return '/assets/icons/apps/simpletext.png'
    if (name.includes('scrapbook')) return '/assets/icons/apps/scrapbook.png'
    if (name.includes('solitaire')) return '/assets/icons/apps/solitaire.png'
    return '/assets/icons/system/application.png'
  }
  return '/assets/icons/system/document.png'
}

function getKindLabel(item: FileNode): string {
  switch (item.type) {
    case 'folder': return 'Folder'
    case 'file': return 'Document'
    case 'markdown': return 'Markdown Document'
    case 'image': return 'Image File'
    case 'application': return 'Application'
    case 'alias': return 'Alias'
    default: return item.type.charAt(0).toUpperCase() + item.type.slice(1)
  }
}

function handleItemContextMenu(event: MouseEvent, item: FileNode) {
  selectItem(item.id)

  const { getTrash } = useFileSystem()
  const trash = getTrash()
  const isInTrash = item.parentId === trash?.id

  const items = [
    {
      id: 'open',
      label: 'Open',
      action: () => handleDoubleClick(item)
    },
    { id: 'sep1', label: '', isSeparator: true },
    {
      id: 'get-info',
      label: 'Get Info',
      action: () => {
        openWindow({
          type: 'get-info',
          title: `Info: ${item.name}`,
          icon: getIcon(item),
          data: { nodeId: item.id },
          width: 300,
          height: 400,
          resizable: false,
          maximizable: false
        })
      }
    }
  ]

  if (isInTrash) {
    items.push({
      id: 'put-away',
      label: 'Put Away',
      action: () => restoreItem(item.id)
    })
  } else if (!item.isSystem) {
    items.push({
      id: 'move-to-trash',
      label: 'Move to Trash',
      action: () => moveToTrash(item.id)
    })
  }

  showContextMenu({ x: event.clientX, y: event.clientY }, items)
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
        <div class="finder__header-actions">
          <button
            class="finder__action-button"
            title="New Folder"
            @click.stop="createNewFolder"
          >
            <img src="/assets/icons/system/folder.png" alt="+" />
          </button>
          <button
            class="finder__action-button"
            title="Move to Trash"
            :disabled="!selectedItemId"
            @click.stop="deleteSelectedItem"
          >
            <img src="/assets/icons/system/trash-empty.png" alt="Del" />
          </button>
          <span class="finder__header-count">{{ items.length }} items</span>
          <button class="finder__view-toggle" @click.stop="toggleViewMode" title="Toggle View Mode">
            {{ viewMode === 'icon' ? 'List' : 'Icon' }}
          </button>
        </div>
      </div>
    </div>

    <div class="finder__path-bar">
      <template v-for="(node, index) in pathNodes" :key="node.id">
        <span
          class="finder__path-part"
          :class="{ 'finder__path-part--last': index === pathNodes.length - 1 }"
          @click.stop="navigateTo(node.id)"
        >
          {{ node.name }}
        </span>
        <span v-if="index < pathNodes.length - 1" class="finder__path-separator">
          <img src="/assets/icons/ui/scroll-arrow-right.png" alt=">" />
        </span>
      </template>
    </div>

    <div
      class="finder__content"
      :class="{ 'finder__content--list': viewMode === 'list' }"
    >
      <template v-if="viewMode === 'icon'">
        <div
          v-for="item in items"
          :key="item.id"
          class="finder__item finder__item--icon"
          :class="{ 'finder__item--selected': selectedItemId === item.id }"
          @click.stop="selectItem(item.id)"
          @dblclick.stop="handleDoubleClick(item)"
          @contextmenu.stop.prevent="handleItemContextMenu($event, item)"
        >
          <div class="finder__item-icon">
            <img :src="getIcon(item)" :alt="item.name" draggable="false" />
          </div>
          <div
            class="finder__item-label"
            :class="{ 'finder__item-label--selected': selectedItemId === item.id }"
            @click.stop="handleLabelClick(item)"
          >
            <template v-if="isRenamingId === item.id">
              <input
                ref="renameInput"
                v-model="editingName"
                type="text"
                class="finder__rename-input"
                @keydown="handleRenameKeyDown"
                @blur="finishRename"
                @click.stop
              />
            </template>
            <template v-else>
              {{ item.name }}
            </template>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="finder__list-header">
          <div class="finder__list-col finder__list-col--name">Name</div>
          <div class="finder__list-col finder__list-col--size">Size</div>
          <div class="finder__list-col finder__list-col--kind">Kind</div>
        </div>
        <div
          v-for="item in items"
          :key="item.id"
          class="finder__item finder__item--list"
          :class="{ 'finder__item--selected': selectedItemId === item.id }"
          @click.stop="selectItem(item.id)"
          @dblclick.stop="handleDoubleClick(item)"
          @contextmenu.stop.prevent="handleItemContextMenu($event, item)"
        >
          <div class="finder__list-col finder__list-col--name">
            <img :src="getIcon(item)" :alt="item.name" class="finder__item-mini-icon" />
            <span
              class="finder__item-name"
              :class="{ 'finder__item-name--selected': selectedItemId === item.id }"
              @click.stop="handleLabelClick(item)"
            >
              <template v-if="isRenamingId === item.id">
                <input
                  ref="renameInput"
                  v-model="editingName"
                  type="text"
                  class="finder__rename-input finder__rename-input--list"
                  @keydown="handleRenameKeyDown"
                  @blur="finishRename"
                  @click.stop
                />
              </template>
              <template v-else>
                {{ item.name }}
              </template>
            </span>
          </div>
          <div class="finder__list-col finder__list-col--size">
            {{ item.type === 'folder' ? '--' : `${Math.ceil(item.size / 1024)}K` }}
          </div>
          <div class="finder__list-col finder__list-col--kind">
            {{ getKindLabel(item) }}
          </div>
        </div>
      </template>
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
  align-items: center;
  width: 100%;
  font-size: var(--font-size-sm);
}

.finder__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.finder__view-toggle {
  background: var(--color-gray-light);
  border: 1px solid var(--color-black);
  font-size: 10px;
  padding: 0 4px;
  cursor: pointer;
}

.finder__action-button {
  width: 18px;
  height: 18px;
  padding: 1px;
  background: none;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.finder__action-button:hover:not(:disabled) {
  border-color: var(--color-black);
  background-color: var(--color-gray-light);
}

.finder__action-button:disabled {
  opacity: 0.3;
  cursor: default;
}

.finder__action-button img {
  width: 14px;
  height: 14px;
  image-rendering: pixelated;
}

.finder__view-toggle:active {
  background: var(--color-black);
  color: var(--color-white);
}

.finder__header-title {
  font-weight: bold;
}

.finder__path-bar {
  background-color: var(--color-gray-light);
  border-bottom: 1px solid var(--color-black);
  padding: 2px var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  flex-wrap: nowrap;
  overflow-x: auto;
  white-space: nowrap;
}

.finder__path-part {
  cursor: pointer;
}

.finder__path-part:hover {
  text-decoration: underline;
}

.finder__path-part--last {
  font-weight: bold;
  cursor: default;
}

.finder__path-part--last:hover {
  text-decoration: none;
}

.finder__path-separator {
  display: flex;
  align-items: center;
}

.finder__path-separator img {
  width: 8px;
  height: 8px;
}

.finder__content {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
}

.finder__content:not(.finder__content--list) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  grid-gap: var(--spacing-md);
  align-content: start;
}

.finder__content--list {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.finder__list-header {
  display: flex;
  background-color: var(--color-gray-light);
  border-bottom: 1px solid var(--color-black);
  font-weight: bold;
  font-size: var(--font-size-sm);
  position: sticky;
  top: 0;
}

.finder__list-col {
  padding: 2px 8px;
  border-right: 1px solid var(--color-gray-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finder__list-col--name { flex: 3; }
.finder__list-col--size { flex: 1; }
.finder__list-col--kind { flex: 2; border-right: none; }

.finder__item--icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 80px;
  cursor: default;
}

.finder__item--list {
  display: flex;
  width: 100%;
  cursor: default;
  font-size: var(--font-size-sm);
}

.finder__item--list:hover {
  background-color: var(--color-gray-light);
}

.finder__item--selected.finder__item--list {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
}

.finder__item-mini-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  vertical-align: middle;
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

.finder__item-name--selected {
  background-color: var(--color-highlight);
  color: var(--color-highlight-text);
  padding: 0 4px;
}

.finder__rename-input {
  width: 100%;
  font-size: var(--font-size-sm);
  font-family: var(--font-system);
  text-align: center;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  color: var(--color-black);
  outline: none;
  padding: 0;
}

.finder__rename-input--list {
  text-align: left;
  padding: 0 2px;
}
</style>
