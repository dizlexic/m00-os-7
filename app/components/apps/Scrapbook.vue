<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'

interface Props {
  isActive?: boolean
}

interface ScrapbookItem {
  type: 'text' | 'image'
  content: string
  createdAt: number
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const { getNodeByPath, updateFileContent } = useFileSystem()

const SCRAPBOOK_FILE_PATH = '/Macintosh HD/System Folder/Scrapbook File'
const items = ref<ScrapbookItem[]>([])
const currentItemIndex = ref(0)
const fileId = ref<string | null>(null)

const currentItem = computed(() => items.value[currentItemIndex.value] || null)
const totalItems = computed(() => items.value.length)
const hasItems = computed(() => items.value.length > 0)

async function loadScrapbook() {
  const node = getNodeByPath(SCRAPBOOK_FILE_PATH)
  if (node && node.type === 'file') {
    fileId.value = node.id
    try {
      const content = JSON.parse(node.content || '[]')
      if (Array.isArray(content)) {
        items.value = content
      }
    } catch (e) {
      console.error('Failed to parse Scrapbook File', e)
      items.value = []
    }
  }
}

function saveScrapbook() {
  if (fileId.value) {
    updateFileContent(fileId.value, JSON.stringify(items.value))
  }
}

function nextItem() {
  if (currentItemIndex.value < items.value.length - 1) {
    currentItemIndex.value++
  }
}

function prevItem() {
  if (currentItemIndex.value > 0) {
    currentItemIndex.value--
  }
}

function deleteItem() {
  if (items.value.length > 0) {
    items.value.splice(currentItemIndex.value, 1)
    if (currentItemIndex.value >= items.value.length && items.value.length > 0) {
      currentItemIndex.value = items.value.length - 1
    }
    if (items.value.length === 0) {
      currentItemIndex.value = 0
    }
    saveScrapbook()
  }
}

async function pasteFromClipboard() {
  try {
    // Try to read from clipboard
    const clipboardItems = await navigator.clipboard.read()

    for (const clipboardItem of clipboardItems) {
      // Check for image types
      const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'))
      if (imageTypes.length > 0) {
        const blob = await clipboardItem.getType(imageTypes[0])
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          items.value.push({
            type: 'image',
            content: dataUrl,
            createdAt: Date.now()
          })
          currentItemIndex.value = items.value.length - 1
          saveScrapbook()
        }
        reader.readAsDataURL(blob)
        return
      }

      // Check for text
      if (clipboardItem.types.includes('text/plain')) {
        const blob = await clipboardItem.getType('text/plain')
        const text = await blob.text()
        if (text.trim()) {
          items.value.push({
            type: 'text',
            content: text,
            createdAt: Date.now()
          })
          currentItemIndex.value = items.value.length - 1
          saveScrapbook()
        }
        return
      }
    }
  } catch (e) {
    // Fallback to text-only clipboard
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        items.value.push({
          type: 'text',
          content: text,
          createdAt: Date.now()
        })
        currentItemIndex.value = items.value.length - 1
        saveScrapbook()
      }
    } catch (err) {
      console.error('Failed to read clipboard', err)
    }
  }
}

async function copyToClipboard() {
  if (!currentItem.value) return

  try {
    if (currentItem.value.type === 'text') {
      await navigator.clipboard.writeText(currentItem.value.content)
    } else if (currentItem.value.type === 'image') {
      // For images, we copy the data URL as text (limited browser support for image copying)
      await navigator.clipboard.writeText(currentItem.value.content)
    }
  } catch (e) {
    console.error('Failed to copy to clipboard', e)
  }
}

onMounted(() => {
  loadScrapbook()
})
</script>

<template>
  <div class="scrapbook">
    <div class="scrapbook__content">
      <div v-if="!hasItems" class="scrapbook__empty">
        <p>Scrapbook is empty</p>
        <p class="scrapbook__hint">Use "Paste" to add items</p>
      </div>

      <div v-else-if="currentItem" class="scrapbook__item">
        <div v-if="currentItem.type === 'text'" class="scrapbook__text">
          {{ currentItem.content }}
        </div>
        <div v-else-if="currentItem.type === 'image'" class="scrapbook__image">
          <img :src="currentItem.content" alt="Scrapbook image" />
        </div>
      </div>
    </div>

    <div class="scrapbook__footer">
      <div class="scrapbook__nav">
        <button
          class="scrapbook__nav-btn"
          :disabled="currentItemIndex === 0 || !hasItems"
          @click="prevItem"
          title="Previous Item"
        >
          ◀
        </button>
        <span class="scrapbook__counter">
          {{ hasItems ? `${currentItemIndex + 1} of ${totalItems}` : '0 of 0' }}
        </span>
        <button
          class="scrapbook__nav-btn"
          :disabled="currentItemIndex >= totalItems - 1 || !hasItems"
          @click="nextItem"
          title="Next Item"
        >
          ▶
        </button>
      </div>

      <div class="scrapbook__actions">
        <button
          class="scrapbook__btn"
          @click="pasteFromClipboard"
          title="Paste from Clipboard"
        >
          Paste
        </button>
        <button
          class="scrapbook__btn"
          :disabled="!hasItems"
          @click="copyToClipboard"
          title="Copy to Clipboard"
        >
          Copy
        </button>
        <button
          class="scrapbook__btn scrapbook__btn--danger"
          :disabled="!hasItems"
          @click="deleteItem"
          title="Delete Item"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrapbook {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-white, #ffffff);
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-md, 12px);
}

.scrapbook__content {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--color-black, #000000);
  margin: 8px;
  background: var(--color-white, #ffffff);
}

.scrapbook__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-gray-dark, #666666);
}

.scrapbook__hint {
  font-size: var(--font-size-sm, 9px);
  margin-top: 8px;
}

.scrapbook__item {
  padding: 8px;
  height: 100%;
  box-sizing: border-box;
}

.scrapbook__text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-system, 'Geneva', sans-serif);
  font-size: var(--font-size-md, 12px);
  line-height: 1.4;
}

.scrapbook__image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.scrapbook__image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.scrapbook__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-top: 1px solid var(--color-gray-medium, #999999);
  background: var(--color-gray-light, #cccccc);
}

.scrapbook__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scrapbook__nav-btn {
  width: 24px;
  height: 20px;
  border: 1px solid var(--color-black, #000000);
  background: var(--color-white, #ffffff);
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scrapbook__nav-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.scrapbook__nav-btn:not(:disabled):active {
  background: var(--color-black, #000000);
  color: var(--color-white, #ffffff);
}

.scrapbook__counter {
  min-width: 60px;
  text-align: center;
  font-size: var(--font-size-sm, 9px);
}

.scrapbook__actions {
  display: flex;
  gap: 4px;
}

.scrapbook__btn {
  padding: 4px 12px;
  border: 1px solid var(--color-black, #000000);
  background: var(--color-white, #ffffff);
  cursor: pointer;
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-sm, 9px);
}

.scrapbook__btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.scrapbook__btn:not(:disabled):active {
  background: var(--color-black, #000000);
  color: var(--color-white, #ffffff);
}

.scrapbook__btn--danger:not(:disabled):hover {
  background: var(--color-gray-light, #cccccc);
}
</style>
