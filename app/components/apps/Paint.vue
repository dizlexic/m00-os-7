<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { MAC_PATTERNS, createPatternCanvas, getPatternDataUrl, type Pattern } from '~/utils/paintPatterns'
import { useFileSystem } from '~/composables/useFileSystem'
import { useWindowManager } from '~/composables/useWindowManager'
import type { Menu } from '~/types/menu'

interface Props {
  fileId?: string
  windowId?: string
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const { getNode, updateFileContent } = useFileSystem()
const { updateWindow } = useWindowManager()

// Canvas refs
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

// Tools state
type Tool = 'pencil' | 'eraser' | 'line' | 'rect' | 'rect-filled' | 'oval' | 'oval-filled' | 'bucket'
const currentTool = ref<Tool>('pencil')
const currentColor = ref('#000000')
const currentLineWidth = ref(1)
const currentPatternId = ref('solid')
const currentPattern = computed(() => MAC_PATTERNS.find(p => p.id === currentPatternId.value) || MAC_PATTERNS[0])

// Drawing state
const isDrawing = ref(false)
const startPos = ref({ x: 0, y: 0 })
const snapshot = ref<ImageData | null>(null)

// Mac OS 7 16-color palette
const colors = [
  '#000000', '#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333',
  '#000080', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000',
  '#FF00FF', '#800080', '#800000', '#008080'
]

const tools = [
  { id: 'pencil', icon: '✎', name: 'Pencil' },
  { id: 'eraser', icon: '□', name: 'Eraser' },
  { id: 'line', icon: '/', name: 'Line' },
  { id: 'rect', icon: '▭', name: 'Rectangle' },
  { id: 'rect-filled', icon: '■', name: 'Filled Rectangle' },
  { id: 'oval', icon: '○', name: 'Oval' },
  { id: 'oval-filled', icon: '●', name: 'Filled Oval' },
  { id: 'bucket', icon: '⧊', name: 'Paint Bucket' }
]

const lineWeights = [1, 2, 4, 8]

const menus = computed<Menu[]>(() => [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New', shortcut: '⌘N', action: () => clearCanvas() },
      { id: 'open', label: 'Open...', shortcut: '⌘O', disabled: true },
      { id: 'sep1', label: '', isSeparator: true },
      { id: 'close', label: 'Close', shortcut: '⌘W', action: () => props.windowId && useWindowManager().closeWindow(props.windowId) },
      { id: 'save', label: 'Save', shortcut: '⌘S', action: () => saveFile() },
      { id: 'save-as', label: 'Save As...', action: () => console.log('Save As') },
      { id: 'sep2', label: '', isSeparator: true },
      { id: 'page-setup', label: 'Page Setup...', disabled: true },
      { id: 'print', label: 'Print...', shortcut: '⌘P', action: () => printCanvas() },
      { id: 'sep3', label: '', isSeparator: true },
      { id: 'quit', label: 'Quit', shortcut: '⌘Q', disabled: true }
    ]
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', shortcut: '⌘Z', disabled: true },
      { id: 'sep1', label: '', isSeparator: true },
      { id: 'cut', label: 'Cut', shortcut: '⌘X', disabled: true },
      { id: 'copy', label: 'Copy', shortcut: '⌘C', disabled: true },
      { id: 'paste', label: 'Paste', shortcut: '⌘V', disabled: true },
      { id: 'clear', label: 'Clear', action: () => clearCanvas() },
      { id: 'sep2', label: '', isSeparator: true },
      { id: 'select-all', label: 'Select All', shortcut: '⌘A', disabled: true }
    ]
  }
])

watch(menus, (newMenus) => {
  if (props.windowId && props.isActive) {
    updateWindow(props.windowId, { menus: newMenus })
  }
}, { immediate: true })

watch(() => props.isActive, (active) => {
  if (active && props.windowId) {
    updateWindow(props.windowId, { menus: menus.value })
  }
})

function initCanvas() {
  if (!canvasRef.value) return
  ctx.value = canvasRef.value.getContext('2d', { willReadFrequently: true })
  if (ctx.value) {
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'

    // Set white background
    ctx.value.fillStyle = '#FFFFFF'
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
}

function getMousePos(event: MouseEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function startDrawing(event: MouseEvent) {
  if (!ctx.value || !canvasRef.value) return
  isDrawing.value = true
  const pos = getMousePos(event)
  startPos.value = pos

  // Save snapshot for previewing shapes
  snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)

  ctx.value.beginPath()
  ctx.value.moveTo(pos.x, pos.y)
  ctx.value.strokeStyle = currentColor.value
  ctx.value.fillStyle = currentColor.value
  ctx.value.lineWidth = currentLineWidth.value

  if (currentTool.value === 'pencil') {
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  } else if (currentTool.value === 'eraser') {
    ctx.value.strokeStyle = '#FFFFFF'
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  } else if (currentTool.value === 'bucket') {
    floodFill(Math.round(pos.x), Math.round(pos.y), currentColor.value)
    isDrawing.value = false
  }
}

function draw(event: MouseEvent) {
  if (!isDrawing.value || !ctx.value || !canvasRef.value || !snapshot.value) return
  const pos = getMousePos(event)

  if (currentTool.value === 'pencil') {
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  } else if (currentTool.value === 'eraser') {
    ctx.value.strokeStyle = '#FFFFFF'
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  } else {
    // For shapes, restore snapshot first to show preview
    ctx.value.putImageData(snapshot.value, 0, 0)

    if (currentTool.value === 'line') {
      ctx.value.beginPath()
      ctx.value.moveTo(startPos.value.x, startPos.value.y)
      ctx.value.lineTo(pos.x, pos.y)
      ctx.value.stroke()
    } else if (currentTool.value === 'rect' || currentTool.value === 'rect-filled') {
      ctx.value.beginPath()
      const x = Math.min(pos.x, startPos.value.x)
      const y = Math.min(pos.y, startPos.value.y)
      const width = Math.abs(pos.x - startPos.value.x)
      const height = Math.abs(pos.y - startPos.value.y)

      if (currentTool.value === 'rect-filled') {
        const fillStyle = getFillStyle()
        ctx.value.fillStyle = fillStyle
        ctx.value.fillRect(x, y, width, height)
        // Draw outline too
        ctx.value.strokeStyle = currentColor.value
        ctx.value.strokeRect(x, y, width, height)
      } else {
        ctx.value.strokeRect(x, y, width, height)
      }
    } else if (currentTool.value === 'oval' || currentTool.value === 'oval-filled') {
      ctx.value.beginPath()
      const x = Math.min(pos.x, startPos.value.x)
      const y = Math.min(pos.y, startPos.value.y)
      const width = Math.abs(pos.x - startPos.value.x)
      const height = Math.abs(pos.y - startPos.value.y)
      ctx.value.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI)

      if (currentTool.value === 'oval-filled') {
        const fillStyle = getFillStyle()
        ctx.value.fillStyle = fillStyle
        ctx.value.fill()
        // Draw outline too
        ctx.value.strokeStyle = currentColor.value
        ctx.value.stroke()
      } else {
        ctx.value.stroke()
      }
    }
  }
}

function stopDrawing() {
  isDrawing.value = false
}

function getFillStyle() {
  if (!ctx.value) return currentColor.value
  if (currentPatternId.value === 'solid') return currentColor.value
  if (currentPatternId.value === 'white') return '#FFFFFF'

  const patternCanvas = createPatternCanvas(currentPattern.value.data, currentColor.value)
  const pattern = ctx.value.createPattern(patternCanvas, 'repeat')
  return pattern || currentColor.value
}

function floodFill(startX: number, startY: number, fillColor: string) {
  if (!ctx.value || !canvasRef.value) return

  const imageData = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height

  const targetR = data[(startY * width + startX) * 4]
  const targetG = data[(startY * width + startX) * 4 + 1]
  const targetB = data[(startY * width + startX) * 4 + 2]
  const targetA = data[(startY * width + startX) * 4 + 3]

  const fillRGB = hexToRgb(fillColor)
  if (!fillRGB) return

  const visited = new Uint8Array(width * height)
  const patternData = currentPattern.value.data
  const stack = [[startX, startY]]

  while (stack.length > 0) {
    const [x, y] = stack.pop()!
    const idx = y * width + x
    const offset = idx * 4

    if (x < 0 || x >= width || y < 0 || y >= height) continue
    if (visited[idx]) continue
    if (data[offset] !== targetR || data[offset + 1] !== targetG || data[offset + 2] !== targetB || data[offset + 3] !== targetA) continue

    visited[idx] = 1
    const isForeground = patternData[y % 8][x % 8] === 1

    if (isForeground) {
      data[offset] = fillRGB.r
      data[offset + 1] = fillRGB.g
      data[offset + 2] = fillRGB.b
      data[offset + 3] = 255
    } else {
      data[offset] = 255
      data[offset + 1] = 255
      data[offset + 2] = 255
      data[offset + 3] = 255
    }

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  ctx.value.putImageData(imageData, 0, 0)
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

function clearCanvas() {
  if (!ctx.value || !canvasRef.value) return
  ctx.value.fillStyle = '#FFFFFF'
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

function printCanvas() {
  if (!canvasRef.value) return
  const dataUrl = canvasRef.value.toDataURL()
  const windowContent = `<img src="${dataUrl}" />`
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(windowContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}

function loadFile() {
  if (props.fileId && canvasRef.value && ctx.value) {
    const file = getNode(props.fileId)
    if (file && (file.type === 'image' || file.type === 'file') && file.content) {
      const img = new Image()
      img.onload = () => {
        if (ctx.value && canvasRef.value) {
          ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
          ctx.value.drawImage(img, 0, 0)
        }
      }
      img.src = file.content
    }
  }
}

function saveFile() {
  if (canvasRef.value) {
    const dataUrl = canvasRef.value.toDataURL('image/png')
    if (props.fileId) {
      updateFileContent(props.fileId, dataUrl)
    } else {
      console.warn('Save As not implemented yet')
      // For now, let's just download it as a fallback if no fileId
      const link = document.createElement('a')
      link.download = 'painting.png'
      link.href = dataUrl
      link.click()
    }
  }
}

onMounted(() => {
  initCanvas()
  loadFile()
})

watch(() => props.fileId, () => {
  loadFile()
})

</script>

<template>
  <div class="paint">
    <div class="paint__toolbar">
      <div class="paint__tools">
        <button
          v-for="tool in tools"
          :key="tool.id"
          class="paint__tool-btn"
          :class="{ 'paint__tool-btn--active': currentTool === tool.id }"
          @click="currentTool = tool.id"
          :title="tool.name"
        >
          {{ tool.icon }}
        </button>
      </div>

      <div class="paint__line-weights">
        <button
          v-for="weight in lineWeights"
          :key="weight"
          class="paint__weight-btn"
          :class="{ 'paint__weight-btn--active': currentLineWidth === weight }"
          @click="currentLineWidth = weight"
        >
          <div :style="{ height: weight + 'px', width: '100%', backgroundColor: 'black' }"></div>
        </button>
      </div>

      <div class="paint__colors">
        <button
          v-for="color in colors"
          :key="color"
          class="paint__color-btn"
          :style="{ backgroundColor: color }"
          :class="{ 'paint__color-btn--active': currentColor === color }"
          @click="currentColor = color"
        ></button>
      </div>

      <div class="paint__patterns">
        <button
          v-for="pattern in MAC_PATTERNS"
          :key="pattern.id"
          class="paint__pattern-btn"
          :class="{ 'paint__pattern-btn--active': currentPatternId === pattern.id }"
          @click="currentPatternId = pattern.id"
          :title="pattern.name"
          :style="{ backgroundImage: `url(${getPatternDataUrl(pattern.data, currentColor)})` }"
        ></button>
      </div>
    </div>

    <div class="paint__canvas-container">
      <canvas
        ref="canvasRef"
        width="600"
        height="400"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.paint {
  display: flex;
  height: 100%;
  background-color: var(--color-gray-light);
  overflow: hidden;
}

.paint__toolbar {
  width: 64px;
  display: flex;
  flex-direction: column;
  padding: 4px;
  border-right: 1px solid var(--color-black);
  gap: 8px;
  background-color: var(--color-gray-light);
  z-index: 10;
}

.paint__tools {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.paint__tool-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.paint__tool-btn--active {
  background-color: var(--color-black);
  color: var(--color-white);
}

.paint__line-weights {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  padding: 2px;
}

.paint__weight-btn {
  height: 16px;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 2px;
}

.paint__weight-btn--active {
  border-color: var(--color-black);
  background-color: var(--color-gray-light);
}

.paint__colors {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.paint__color-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--color-black);
  cursor: pointer;
}

.paint__color-btn--active {
  outline: 2px solid var(--color-white);
  outline-offset: -4px;
}

.paint__patterns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 2px;
  border-top: 1px solid var(--color-black);
  padding-top: 4px;
}

.paint__pattern-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--color-black);
  cursor: pointer;
  background-repeat: repeat;
  background-size: 8px 8px;
  image-rendering: pixelated;
  background-color: white;
}

.paint__pattern-btn--active {
  outline: 2px solid var(--color-black);
  outline-offset: 1px;
}

.paint__canvas-container {
  flex: 1;
  padding: 8px;
  overflow: auto;
  background-color: var(--color-gray-medium);
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
}

canvas {
  background-color: white;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
  cursor: crosshair;
  image-rendering: pixelated;
}
</style>
