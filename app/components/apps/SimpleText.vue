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

// Find/Replace state
const showFindReplace = ref(false)
const findText = ref('')
const replaceText = ref('')
const findIndex = ref(0)

// Font settings
const currentFont = ref('var(--font-system)')
const currentFontSize = ref('var(--font-size-md)')

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

/**
 * Toggle Find/Replace dialog
 */
function toggleFindReplace() {
  showFindReplace.value = !showFindReplace.value
}

/**
 * Find next occurrence of text
 */
function findNext() {
  if (!findText.value) return
  const text = content.value
  const index = text.indexOf(findText.value, findIndex.value)

  if (index !== -1) {
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(index, index + findText.value.length)
      findIndex.value = index + findText.value.length
    }
  } else {
    // Wrap around
    const wrapIndex = text.indexOf(findText.value, 0)
    if (wrapIndex !== -1) {
      if (textareaRef.value) {
        textareaRef.value.focus()
        textareaRef.value.setSelectionRange(wrapIndex, wrapIndex + findText.value.length)
        findIndex.value = wrapIndex + findText.value.length
      }
    }
  }
}

/**
 * Replace current selection and find next
 */
function replace() {
  if (!textareaRef.value) return
  const start = textareaRef.value.selectionStart
  const end = textareaRef.value.selectionEnd
  const selected = content.value.substring(start, end)

  if (selected === findText.value) {
    const before = content.value.substring(0, start)
    const after = content.value.substring(end)
    content.value = before + replaceText.value + after

    // Set cursor and find next
    setTimeout(() => {
      if (textareaRef.value) {
        textareaRef.value.setSelectionRange(start + replaceText.value.length, start + replaceText.value.length)
        findIndex.value = start + replaceText.value.length
        findNext()
      }
    }, 0)
  } else {
    findNext()
  }
}

/**
 * Replace all occurrences
 */
function replaceAll() {
  if (!findText.value) return
  const regex = new RegExp(escapeRegExp(findText.value), 'g')
  content.value = content.value.replace(regex, replaceText.value)
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
  if ((event.metaKey || event.ctrlKey) && event.key === 'f') {
    event.preventDefault()
    toggleFindReplace()
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
function setFont(font: string) {
  currentFont.value = font
}

function setFontSize(size: string) {
  currentFontSize.value = size
}

defineExpose({
  selectAll,
  copyText,
  cutText,
  pasteText,
  saveFile,
  toggleFindReplace,
  setFont,
  setFontSize
})
</script>

<template>
  <div class="simple-text">
    <div v-if="showFindReplace" class="simple-text__find-replace">
      <div class="find-replace__row">
        <label>Find:</label>
        <input v-model="findText" type="text" @keydown.enter="findNext" />
      </div>
      <div class="find-replace__row">
        <label>Replace:</label>
        <input v-model="replaceText" type="text" @keydown.enter="replace" />
      </div>
      <div class="find-replace__actions">
        <button class="simple-text__btn" @click="findNext">Find Next</button>
        <button class="simple-text__btn" @click="replace">Replace</button>
        <button class="simple-text__btn" @click="replaceAll">Replace All</button>
        <button class="simple-text__btn" @click="toggleFindReplace">Close</button>
      </div>
    </div>
    <textarea
      ref="textareaRef"
      v-model="content"
      class="simple-text__editor"
      :style="{ fontFamily: currentFont, fontSize: currentFontSize }"
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

.simple-text__find-replace {
  padding: 8px;
  background-color: var(--color-gray-light);
  border-bottom: 1px solid var(--color-black);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.find-replace__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.find-replace__row label {
  width: 60px;
  font-size: var(--font-size-sm);
}

.find-replace__row input {
  flex: 1;
  border: 1px solid var(--color-black);
  padding: 2px 4px;
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
}

.find-replace__actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.simple-text__btn {
  padding: 2px 8px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  font-size: var(--font-size-sm);
  cursor: pointer;
  box-shadow: 1px 1px 0 var(--color-black);
}

.simple-text__btn:active {
  background-color: var(--color-black);
  color: var(--color-white);
  box-shadow: none;
  transform: translate(1px, 1px);
}
</style>
