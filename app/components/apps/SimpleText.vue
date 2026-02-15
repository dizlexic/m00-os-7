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

function loadFile() {
  if (props.fileId) {
    const file = getNode(props.fileId)
    if (file && file.type === 'file') {
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

function handleKeyDown(event: KeyboardEvent) {
  if (!props.isActive) return
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    saveFile()
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
</script>

<template>
  <div class="simple-text">
    <textarea
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
