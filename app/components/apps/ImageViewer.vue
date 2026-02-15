<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useFileSystem } from '~/composables/useFileSystem'

interface Props {
  fileId?: string
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const { getNode } = useFileSystem()
const imageUrl = ref('')
const fileName = ref('Image')
const loading = ref(false)
const error = ref(false)

function loadImage() {
  if (props.fileId) {
    const file = getNode(props.fileId)
    if (file && file.type === 'image') {
      loading.value = true
      error.value = false
      fileName.value = file.name

      // In our virtual filesystem, content might be a URL or base64
      // For now we'll assume it's something we can put in an src
      imageUrl.value = file.content || ''
      loading.value = false
    } else {
      error.value = true
    }
  }
}

watch(() => props.fileId, loadImage)

onMounted(() => {
  loadImage()
})
</script>

<template>
  <div class="image-viewer">
    <div v-if="loading" class="image-viewer__status">Loading...</div>
    <div v-else-if="error || !imageUrl" class="image-viewer__status">Error loading image</div>
    <div v-else class="image-viewer__content">
      <img :src="imageUrl" :alt="fileName" class="image-viewer__image" />
    </div>
  </div>
</template>

<style scoped>
.image-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-gray-light);
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer__status {
  padding: var(--spacing-md);
  font-family: var(--font-system);
}

.image-viewer__content {
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer__image {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 2px 2px 0 var(--color-black);
  background-color: var(--color-white);
  image-rendering: pixelated;
}
</style>
