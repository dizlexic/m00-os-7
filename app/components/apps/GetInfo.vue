<script setup lang="ts">
import { computed } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'

const props = defineProps<{
  nodeId: string
}>()

const { getNode } = useFileSystem()
const node = computed(() => getNode(props.nodeId))

const icon = computed(() => {
  if (!node.value) return '/assets/icons/system/document.png'
  if (node.value.type === 'folder') return '/assets/icons/system/folder-closed.png'
  if (node.value.type === 'application') {
    if (node.value.name === 'Calculator') return '/assets/icons/apps/calculator.png'
    if (node.value.name === 'SimpleText') return '/assets/icons/apps/simpletext.png'
    return '/assets/icons/apps/generic.png'
  }
  return '/assets/icons/system/document.png'
})

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'Unknown'
  return new Date(timestamp).toLocaleString()
}

const kind = computed(() => {
  if (!node.value) return 'Unknown'
  switch (node.value.type) {
    case 'folder': return 'Folder'
    case 'file': return 'Document'
    case 'application': return 'Application'
    default: return 'Unknown'
  }
})

const sizeFormatted = computed(() => {
  if (!node.value) return '0 bytes'
  if (node.value.type === 'folder') return '--'
  const bytes = node.value.size || 0
  if (bytes < 1024) return `${bytes} bytes`
  return `${(bytes / 1024).toFixed(1)} KB`
})

const where = computed(() => {
  // TODO: Implement path resolution if needed
  return 'Macintosh HD'
})
</script>

<template>
  <div v-if="node" class="get-info no-select">
    <div class="get-info__header">
      <img :src="icon" :alt="node.name" class="get-info__icon" />
      <div class="get-info__title-section">
        <h1 class="get-info__name">{{ node.name }}</h1>
        <p class="get-info__kind">Kind: {{ kind }}</p>
      </div>
    </div>

    <div class="get-info__details">
      <div class="get-info__row">
        <span class="get-info__label">Size:</span>
        <span class="get-info__value">{{ sizeFormatted }}</span>
      </div>
      <div class="get-info__row">
        <span class="get-info__label">Where:</span>
        <span class="get-info__value">{{ where }}</span>
      </div>
      <div class="get-info__divider"></div>
      <div class="get-info__row">
        <span class="get-info__label">Created:</span>
        <span class="get-info__value">{{ formatDate(node.createdAt) }}</span>
      </div>
      <div class="get-info__row">
        <span class="get-info__label">Modified:</span>
        <span class="get-info__value">{{ formatDate(node.modifiedAt) }}</span>
      </div>
      <div class="get-info__divider"></div>
      <div class="get-info__row">
        <span class="get-info__label">Comments:</span>
      </div>
      <textarea class="get-info__comments" placeholder="Add comments here..."></textarea>
    </div>

    <div class="get-info__footer">
      <label class="mac-checkbox">
        <div class="mac-checkbox__box"></div>
        <span>Locked</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.get-info {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  background-color: var(--color-white);
  height: 100%;
  font-family: var(--font-system);
}

.get-info__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.get-info__icon {
  width: 32px;
  height: 32px;
}

.get-info__title-section {
  flex: 1;
}

.get-info__name {
  font-size: var(--font-size-lg);
  font-weight: bold;
  margin: 0;
}

.get-info__kind {
  font-size: var(--font-size-md);
  margin: 0;
}

.get-info__details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

.get-info__row {
  display: flex;
  font-size: var(--font-size-md);
}

.get-info__label {
  width: 80px;
  font-weight: bold;
}

.get-info__value {
  flex: 1;
}

.get-info__divider {
  height: 1px;
  background-color: var(--color-gray-medium);
  margin: var(--spacing-sm) 0;
}

.get-info__comments {
  flex: 1;
  border: 1px solid var(--color-black);
  padding: var(--spacing-sm);
  font-family: inherit;
  font-size: var(--font-size-md);
  resize: none;
  margin-top: var(--spacing-xs);
  outline: none;
}

.get-info__footer {
  margin-top: var(--spacing-lg);
}
</style>
