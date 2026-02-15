<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'

interface Props {
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const { getNodeByPath, updateFileContent, createFile } = useFileSystem()

const NOTEPAD_FILE_PATH = '/Macintosh HD/System Folder/Note Pad File'
const pages = ref<string[]>([''])
const currentPageIndex = ref(0)
const fileId = ref<string | null>(null)

async function loadNotePad() {
  const node = getNodeByPath(NOTEPAD_FILE_PATH)
  if (node && node.type === 'file') {
    fileId.value = node.id
    try {
      const content = JSON.parse(node.content || '[""]')
      if (Array.isArray(content)) {
        pages.value = content
      }
    } catch (e) {
      console.error('Failed to parse Note Pad File', e)
      pages.value = ['']
    }
  } else {
    // Create the file if it doesn't exist?
    // For now just keep it in memory if not found, but in a real app we'd want to persist it.
  }
}

function saveNotePad() {
  if (fileId.value) {
    updateFileContent(fileId.value, JSON.stringify(pages.value))
  }
}

function nextPage() {
  if (currentPageIndex.value < pages.value.length - 1) {
    currentPageIndex.value++
  } else {
    pages.value.push('')
    currentPageIndex.value++
    saveNotePad()
  }
}

function prevPage() {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
  }
}

function deletePage() {
  if (pages.value.length > 1) {
    pages.value.splice(currentPageIndex.value, 1)
    if (currentPageIndex.value >= pages.value.length) {
      currentPageIndex.value = pages.value.length - 1
    }
  } else {
    pages.value[0] = ''
  }
  saveNotePad()
}

watch(() => pages.value[currentPageIndex.value], () => {
  saveNotePad()
}, { deep: true })

onMounted(() => {
  loadNotePad()
})
</script>

<template>
  <div class="note-pad">
    <div class="note-pad__content">
      <textarea
        v-model="pages[currentPageIndex]"
        class="note-pad__textarea"
        spellcheck="false"
      ></textarea>
    </div>

    <div class="note-pad__footer">
      <div class="note-pad__page-curl" @click.stop>
        <div
          class="note-pad__curl-upper"
          @click="prevPage"
          title="Previous Page"
          data-testid="prev-page"
        ></div>
        <div
          class="note-pad__curl-lower"
          @click="nextPage"
          title="Next Page"
          data-testid="next-page"
        ></div>
        <svg class="note-pad__curl-svg" viewBox="0 0 40 40">
          <path d="M 0 40 L 40 40 L 0 0 Z" fill="white" stroke="black" />
          <path d="M 0 0 L 15 15 L 0 30 Z" fill="#ccc" stroke="black" />
        </svg>
      </div>

      <div class="note-pad__info">
        <div class="note-pad__page-indicator">
          {{ currentPageIndex + 1 }}
        </div>
        <button
          data-testid="delete-page"
          @click="deletePage"
          class="note-pad__delete-btn"
          title="Delete current page"
        >
          <span class="sr-only">Delete</span>
          <svg width="12" height="12" viewBox="0 0 12 12">
             <path d="M 2 2 L 10 10 M 10 2 L 2 10" stroke="black" stroke-width="1" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-pad {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-white);
  padding: var(--spacing-md);
  position: relative;
  border: 1px solid var(--color-black);
  box-shadow: 2px 2px 0 var(--color-black);
}

.note-pad__content {
  flex: 1;
  position: relative;
  background-image: linear-gradient(var(--color-gray-light) 1px, transparent 1px);
  background-size: 100% 1.5rem;
  margin-bottom: var(--spacing-md);
}

.note-pad__textarea {
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  padding: 0;
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  outline: none;
  background-color: transparent;
  line-height: 1.5rem;
  overflow-y: auto;
}

.note-pad__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 40px;
}

.note-pad__page-curl {
  position: relative;
  width: 40px;
  height: 40px;
}

.note-pad__curl-svg {
  width: 40px;
  height: 40px;
  pointer-events: none;
}

.note-pad__curl-upper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  cursor: pointer;
  z-index: 1;
}

.note-pad__curl-lower {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50%;
  cursor: pointer;
  z-index: 1;
}

.note-pad__info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.note-pad__page-indicator {
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  font-weight: bold;
}

.note-pad__delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.note-pad__delete-btn:active {
  background-color: var(--color-black);
}

.note-pad__delete-btn:active svg path {
  stroke: var(--color-white);
}
</style>
