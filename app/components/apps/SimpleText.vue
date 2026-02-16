<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'

interface Props {
  fileId?: string
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})
const { getNode, updateFileContent } = useFileSystem()

const content = ref('')
const fileName = ref('Untitled')
const isDirty = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function loadFile() {
  if (props.fileId) {
    const file = getNode(props.fileId)
    if (file && (file.type === 'file' || file.type === 'markdown')) {
      content.value = file.content || ''
      fileName.value = file.name
      isDirty.value = false
    }
  } else {
    content.value = ''
    fileName.value = 'Untitled'
    isDirty.value = false
  }
}

function saveFile() {
  if (props.fileId) {
    updateFileContent(props.fileId, content.value)
    isDirty.value = false
  } else {
    // TODO: Implement "Save As" for new files
    console.warn('Save As not implemented yet')
  }
}

/**
 * Select all text in the editor
 */
function selectAll() {
  if (textareaRef.value) {
    textareaRef.value.focus()
    textareaRef.value.setSelectionRange(0, textareaRef.value.value.length)
  }
}

/**
 * Check if there is any text selected
 */
function hasSelection(): boolean {
  if (!textareaRef.value) return false
  return textareaRef.value.selectionStart !== textareaRef.value.selectionEnd
}

/**
 * Get the currently selected text
 */
function getSelectedText(): string {
  if (!textareaRef.value) return ''
  const start = textareaRef.value.selectionStart
  const end = textareaRef.value.selectionEnd
  return textareaRef.value.value.substring(start, end)
}

/**
 * Copy selected text to clipboard
 */
async function copyText(): Promise<void> {
  const selectedText = getSelectedText()
  if (selectedText) {
    await navigator.clipboard.writeText(selectedText)
  }
}

/**
 * Cut selected text to clipboard
 */
async function cutText(): Promise<void> {
  if (!textareaRef.value) return
  const selectedText = getSelectedText()
  if (selectedText) {
    await navigator.clipboard.writeText(selectedText)
    const start = textareaRef.value.selectionStart
    const end = textareaRef.value.selectionEnd
    const before = textareaRef.value.value.substring(0, start)
    const after = textareaRef.value.value.substring(end)
    content.value = before + after
    // Update the textarea value directly for immediate effect
    textareaRef.value.value = content.value
    textareaRef.value.setSelectionRange(start, start)
  }
}

/**
 * Paste text from clipboard at cursor position
 */
async function pasteText(): Promise<void> {
  if (!textareaRef.value) return
  try {
    const clipboardText = await navigator.clipboard.readText()
    const start = textareaRef.value.selectionStart
    const end = textareaRef.value.selectionEnd
    const before = textareaRef.value.value.substring(0, start)
    const after = textareaRef.value.value.substring(end)
    content.value = before + clipboardText + after
    // Update the textarea value directly for immediate effect
    textareaRef.value.value = content.value
    const newCursorPos = start + clipboardText.length
    textareaRef.value.setSelectionRange(newCursorPos, newCursorPos)
  } catch (error) {
    console.warn('Failed to read from clipboard:', error)
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (!props.isActive) return
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    saveFile()
  }
  if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
    event.preventDefault()
    selectAll()
  }
}

watch(content, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    isDirty.value = true
  }
})

watch(() => props.fileId, loadFile)

onMounted(() => {
  loadFile()
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Expose methods for external use (e.g., menu bar integration)
defineExpose({
  selectAll,
  hasSelection,
  copyText,
  cutText,
  pasteText,
  saveFile
})
</script>

<template>
  <div class="simple-text">
    <textarea
      ref="textareaRef"
      v-model="content"
      class="simple-text__editor"
      spellcheck="false"
    ></textarea>
  </div>
</template>

<style scoped>
.simple-text {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-white);
}

.simple-text__editor {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  padding: var(--spacing-sm);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  outline: none;
  white-space: pre-wrap;
  background-color: transparent;
}
</style>
