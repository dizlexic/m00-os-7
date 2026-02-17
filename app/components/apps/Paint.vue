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
type Tool = 'select-rect' | 'select-lasso' | 'pencil' | 'eraser' | 'spray' | 'text' | 'line' | 'rect' | 'rect-filled' | 'round-rect' | 'round-rect-filled' | 'oval' | 'oval-filled' | 'polygon' | 'polygon-filled' | 'arc' | 'arc-filled' | 'bucket'
const currentTool = ref<Tool>('pencil')
const currentColor = ref('#000000')
const currentLineWidth = ref(1)
const currentPatternId = ref('solid')
const currentPattern = computed(() => MAC_PATTERNS.find(p => p.id === currentPatternId.value) || MAC_PATTERNS[0])

// Drawing state
const isDrawing = ref(false)
const startPos = ref({ x: 0, y: 0 })
const snapshot = ref<ImageData | null>(null)

// Selection state
const selectionRect = ref<{ x: number, y: number, width: number, height: number } | null>(null)
const selectionActive = ref(false)
const isMovingSelection = ref(false)
const selectionOffset = ref({ x: 0, y: 0 })
const selectionSnapshot = ref<ImageData | null>(null)
const lassoPoints = ref<{ x: number, y: number }[]>([])
const polygonPoints = ref<{ x: number, y: number }[]>([])
const clipboard = ref<ImageData | null>(null)

function resetPolygon() {
  polygonPoints.value = []
  if (isDrawing.value && (currentTool.value === 'polygon' || currentTool.value === 'polygon-filled')) {
    isDrawing.value = false
  }
}

watch(currentTool, () => {
  resetPolygon()
})

// History state
const history = ref<ImageData[]>([])
const historyIndex = ref(-1)
const maxHistory = 20

// Mac OS 7 16-color palette
const colors = [
  '#000000', '#FFFFFF', '#CCCCCC', '#999999', '#666666', '#333333',
  '#000080', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000',
  '#FF00FF', '#800080', '#800000', '#008080'
]

const tools = [
  { id: 'select-rect', icon: '✂', name: 'Marquee' },
  { id: 'select-lasso', icon: '➰', name: 'Lasso' },
  { id: 'pencil', icon: '✎', name: 'Pencil' },
  { id: 'eraser', icon: '□', name: 'Eraser' },
  { id: 'spray', icon: '⁑', name: 'Spray Can' },
  { id: 'text', icon: 'A', name: 'Text Tool' },
  { id: 'line', icon: '/', name: 'Line' },
  { id: 'rect', icon: '▭', name: 'Rectangle' },
  { id: 'rect-filled', icon: '■', name: 'Filled Rectangle' },
  { id: 'round-rect', icon: '▢', name: 'Rounded Rectangle' },
  { id: 'round-rect-filled', icon: '▰', name: 'Filled Rounded Rect' },
  { id: 'oval', icon: '○', name: 'Oval' },
  { id: 'oval-filled', icon: '●', name: 'Filled Oval' },
  { id: 'polygon', icon: '⬠', name: 'Polygon' },
  { id: 'polygon-filled', icon: '⬟', name: 'Filled Polygon' },
  { id: 'arc', icon: '⌒', name: 'Arc' },
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
      { id: 'save-as', label: 'Save As...', action: () => saveFile() },
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
      { id: 'undo', label: 'Undo', shortcut: '⌘Z', action: () => undo(), disabled: historyIndex.value <= 0 },
      { id: 'redo', label: 'Redo', shortcut: '⌘Y', action: () => redo(), disabled: historyIndex.value >= history.value.length - 1 },
      { id: 'sep1', label: '', isSeparator: true },
      { id: 'cut', label: 'Cut', shortcut: '⌘X', action: () => cutSelection(), disabled: !selectionActive.value },
      { id: 'copy', label: 'Copy', shortcut: '⌘C', action: () => copySelection(), disabled: !selectionActive.value },
      { id: 'paste', label: 'Paste', shortcut: '⌘V', action: () => pasteSelection() },
      { id: 'clear', label: 'Clear', action: () => clearCanvas() },
      { id: 'sep2', label: '', isSeparator: true },
      { id: 'select-all', label: 'Select All', shortcut: '⌘A', action: () => selectAll() }
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
    snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    saveToHistory()
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

function getTouchPos(event: TouchEvent) {
  if (!canvasRef.value || event.touches.length === 0) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const touch = event.touches[0]
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  }
}

function startDrawing(event: MouseEvent) {
  startDrawingAt(getMousePos(event))
}

let lastTapTime = 0
function handleTouchStart(event: TouchEvent) {
  event.preventDefault()
  if (event.touches.length !== 1) return
  const pos = getTouchPos(event)

  // Double tap to finish polygon
  const currentTime = Date.now()
  if (currentTime - lastTapTime < 300 && (currentTool.value === 'polygon' || currentTool.value === 'polygon-filled')) {
    finishPolygon()
    lastTapTime = 0
    return
  }
  lastTapTime = currentTime

  startDrawingAt(pos)
}

function startDrawingAt(pos: { x: number, y: number }) {
  if (!ctx.value || !canvasRef.value) return

  // Handle moving existing selection
  if (selectionActive.value && selectionRect.value && isInsideRect(pos, selectionRect.value)) {
    isMovingSelection.value = true
    selectionOffset.value = {
      x: pos.x - selectionRect.value.x,
      y: pos.y - selectionRect.value.y
    }
    // Save current canvas state to snapshot before moving
    snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    return
  }

  // Clear selection if clicking outside or using another tool
  if (currentTool.value !== 'select-rect' && currentTool.value !== 'select-lasso') {
    if (selectionActive.value) {
      finalizeSelection()
    }
  } else if (!isInsideRect(pos, selectionRect.value || { x: 0, y: 0, width: 0, height: 0 })) {
    if (selectionActive.value) {
      finalizeSelection()
    }
  }

  isDrawing.value = true
  startPos.value = pos

  if (currentTool.value === 'polygon' || currentTool.value === 'polygon-filled') {
    if (polygonPoints.value.length === 0) {
      polygonPoints.value = [pos]
      snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
    } else {
      // Check if clicking near the first point to close it
      const firstPoint = polygonPoints.value[0]
      const dist = Math.sqrt(Math.pow(pos.x - firstPoint.x, 2) + Math.pow(pos.y - firstPoint.y, 2))
      if (dist < 5 && polygonPoints.value.length > 2) {
        finishPolygon()
        return
      } else {
        polygonPoints.value.push(pos)
      }
    }
    return
  }

  if (currentTool.value === 'select-lasso') {
    lassoPoints.value = [pos]
  }

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
  } else if (currentTool.value === 'text') {
    drawText(pos.x, pos.y)
    isDrawing.value = false
  }
}

function isInsideRect(pos: { x: number, y: number }, rect: { x: number, y: number, width: number, height: number }) {
  return pos.x >= rect.x && pos.x <= rect.x + rect.width &&
         pos.y >= rect.y && pos.y <= rect.y + rect.height
}

function finalizeSelection() {
  if (!ctx.value || !selectionRect.value || !selectionSnapshot.value) {
    selectionActive.value = false
    selectionRect.value = null
    return
  }

  // Draw the selection onto the canvas permanently
  // Use a temporary canvas to support transparency with drawImage
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = selectionRect.value.width
  tempCanvas.height = selectionRect.value.height
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.putImageData(selectionSnapshot.value, 0, 0)
  ctx.value.drawImage(tempCanvas, selectionRect.value.x, selectionRect.value.y)

  selectionActive.value = false
  selectionRect.value = null
  selectionSnapshot.value = null

  // Update snapshot after finalizing
  if (canvasRef.value) {
    snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
  saveToHistory()
}

function draw(event: MouseEvent) {
  drawAt(getMousePos(event))
}

function handleTouchMove(event: TouchEvent) {
  event.preventDefault()
  if (event.touches.length !== 1) return
  drawAt(getTouchPos(event))
}

function handleTouchEnd(event: TouchEvent) {
  event.preventDefault()
  stopDrawing()
}

function drawAt(pos: { x: number, y: number }) {
  if (!ctx.value || !canvasRef.value || !snapshot.value) return
  if (!isDrawing.value && !isMovingSelection.value) return

  if (isMovingSelection.value && selectionRect.value && selectionSnapshot.value) {
    ctx.value.putImageData(snapshot.value, 0, 0)
    selectionRect.value.x = pos.x - selectionOffset.value.x
    selectionRect.value.y = pos.y - selectionOffset.value.y

    // Draw selectionSnapshot with transparency
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = selectionRect.value.width
    tempCanvas.height = selectionRect.value.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(selectionSnapshot.value, 0, 0)
    ctx.value.drawImage(tempCanvas, selectionRect.value.x, selectionRect.value.y)

    drawSelectionMarquee()
    return
  }

  if (currentTool.value === 'polygon' || currentTool.value === 'polygon-filled') {
    if (polygonPoints.value.length > 0) {
      ctx.value.putImageData(snapshot.value, 0, 0)
      ctx.value.beginPath()
      ctx.value.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y)
      for (let i = 1; i < polygonPoints.value.length; i++) {
        ctx.value.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y)
      }
      ctx.value.lineTo(pos.x, pos.y)
      ctx.value.stroke()
    }
    return
  }

  if (currentTool.value === 'pencil') {
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  } else if (currentTool.value === 'eraser') {
    ctx.value.strokeStyle = '#FFFFFF'
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  } else if (currentTool.value === 'spray') {
    drawSpray(pos.x, pos.y)
  } else if (currentTool.value === 'select-rect') {
    ctx.value.putImageData(snapshot.value, 0, 0)
    const x = Math.min(pos.x, startPos.value.x)
    const y = Math.min(pos.y, startPos.value.y)
    const width = Math.abs(pos.x - startPos.value.x)
    const height = Math.abs(pos.y - startPos.value.y)
    selectionRect.value = { x, y, width, height }
    drawSelectionMarquee()
  } else if (currentTool.value === 'select-lasso') {
    ctx.value.putImageData(snapshot.value, 0, 0)
    lassoPoints.value.push(pos)

    ctx.value.beginPath()
    ctx.value.moveTo(lassoPoints.value[0].x, lassoPoints.value[0].y)
    for (let i = 1; i < lassoPoints.value.length; i++) {
      ctx.value.lineTo(lassoPoints.value[i].x, lassoPoints.value[i].y)
    }
    ctx.value.setLineDash([4, 4])
    ctx.value.strokeStyle = '#000000'
    ctx.value.lineWidth = 1
    ctx.value.stroke()
    ctx.value.setLineDash([])
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
    } else if (currentTool.value === 'round-rect' || currentTool.value === 'round-rect-filled') {
      const x = Math.min(pos.x, startPos.value.x)
      const y = Math.min(pos.y, startPos.value.y)
      const width = Math.abs(pos.x - startPos.value.x)
      const height = Math.abs(pos.y - startPos.value.y)
      const radius = Math.min(width, height) * 0.2 // Adaptive radius

      drawRoundedRectPath(x, y, width, height, radius)
      if (currentTool.value === 'round-rect-filled') {
        const fillStyle = getFillStyle()
        ctx.value.fillStyle = fillStyle
        ctx.value.fill()
        ctx.value.strokeStyle = currentColor.value
        ctx.value.stroke()
      } else {
        ctx.value.stroke()
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
    } else if (currentTool.value === 'arc' || currentTool.value === 'arc-filled') {
      ctx.value.beginPath()
      const x = Math.min(pos.x, startPos.value.x)
      const y = Math.min(pos.y, startPos.value.y)
      const width = Math.abs(pos.x - startPos.value.x)
      const height = Math.abs(pos.y - startPos.value.y)

      // Determine quadrant based on drag direction
      let startAngle = 0
      let endAngle = Math.PI / 2

      if (pos.x < startPos.value.x && pos.y < startPos.value.y) {
        // Top left
        startAngle = Math.PI
        endAngle = 1.5 * Math.PI
      } else if (pos.x > startPos.value.x && pos.y < startPos.value.y) {
        // Top right
        startAngle = 1.5 * Math.PI
        endAngle = 2 * Math.PI
      } else if (pos.x < startPos.value.x && pos.y > startPos.value.y) {
        // Bottom left
        startAngle = 0.5 * Math.PI
        endAngle = Math.PI
      } else {
        // Bottom right
        startAngle = 0
        endAngle = 0.5 * Math.PI
      }

      // Draw arc. If filled, it's a wedge (pie slice)
      if (currentTool.value === 'arc-filled') {
        ctx.value.moveTo(startPos.value.x, startPos.value.y)
        // Center is startPos for the wedge?
        // No, if it's like Oval, it's inscribed in the rect.
        const centerX = x + width / 2
        const centerY = y + height / 2
        ctx.value.moveTo(centerX, centerY)
        ctx.value.ellipse(centerX, centerY, width / 2, height / 2, 0, startAngle, endAngle)
        ctx.value.lineTo(centerX, centerY)
        ctx.value.closePath()
        ctx.value.fillStyle = getFillStyle()
        ctx.value.fill()
        ctx.value.strokeStyle = currentColor.value
        ctx.value.stroke()
      } else {
        // For non-filled, just the curve.
        // We need to find the correct center so the curve starts/ends at startPos/pos
        // Actually, let's keep it simple and just use the bounding box logic.
        ctx.value.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, startAngle, endAngle)
        ctx.value.stroke()
      }
    }
  }
}

function finishPolygon() {
  if (!ctx.value || polygonPoints.value.length < 2) {
    resetPolygon()
    return
  }

  // Restore before drawing the final closed shape
  ctx.value.putImageData(snapshot.value!, 0, 0)

  ctx.value.beginPath()
  ctx.value.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y)
  for (let i = 1; i < polygonPoints.value.length; i++) {
    ctx.value.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y)
  }
  ctx.value.closePath()

  if (currentTool.value === 'polygon-filled') {
    ctx.value.fillStyle = getFillStyle()
    ctx.value.fill()
    // Always stroke the outline in Mac Paint
    ctx.value.strokeStyle = currentColor.value
    ctx.value.lineWidth = currentLineWidth.value
    ctx.value.stroke()
  } else {
    ctx.value.strokeStyle = currentColor.value
    ctx.value.lineWidth = currentLineWidth.value
    ctx.value.stroke()
  }

  resetPolygon()
  saveToHistory()
}

function stopDrawing() {
  if (isMovingSelection.value) {
    isMovingSelection.value = false
    return
  }

  if (isDrawing.value) {
    if (currentTool.value === 'polygon' || currentTool.value === 'polygon-filled') {
      // Don't stop drawing on mouseup for polygons
      return
    }

    if (currentTool.value === 'select-rect' && selectionRect.value) {
      if (selectionRect.value.width > 0 && selectionRect.value.height > 0) {
        selectionActive.value = true
        // Capture the selected pixels
        selectionSnapshot.value = ctx.value!.getImageData(selectionRect.value.x, selectionRect.value.y, selectionRect.value.width, selectionRect.value.height)

        // Clear the area on the canvas (cut behavior)
        ctx.value!.fillStyle = '#FFFFFF'
        ctx.value!.fillRect(selectionRect.value.x, selectionRect.value.y, selectionRect.value.width, selectionRect.value.height)
        snapshot.value = ctx.value!.getImageData(0, 0, canvasRef.value!.width, canvasRef.value!.height)
        drawSelectionMarquee()
      } else {
        selectionActive.value = false
        selectionRect.value = null
      }
    } else if (currentTool.value === 'select-lasso' && lassoPoints.value.length > 2) {
      // Find bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      lassoPoints.value.forEach(p => {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y)
      })
      const width = Math.ceil(maxX - minX)
      const height = Math.ceil(maxY - minY)

      if (width > 0 && height > 0) {
        selectionRect.value = { x: Math.floor(minX), y: Math.floor(minY), width, height }
        selectionActive.value = true

        // Create mask
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = width
        maskCanvas.height = height
        const maskCtx = maskCanvas.getContext('2d')!
        maskCtx.translate(-Math.floor(minX), -Math.floor(minY))
        maskCtx.beginPath()
        maskCtx.moveTo(lassoPoints.value[0].x, lassoPoints.value[0].y)
        lassoPoints.value.forEach(p => maskCtx.lineTo(p.x, p.y))
        maskCtx.closePath()
        maskCtx.fill()

        // Extract pixels
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width
        tempCanvas.height = height
        const tempCtx = tempCanvas.getContext('2d')!
        tempCtx.drawImage(canvasRef.value!, Math.floor(minX), Math.floor(minY), width, height, 0, 0, width, height)
        tempCtx.globalCompositeOperation = 'destination-in'
        tempCtx.drawImage(maskCanvas, 0, 0)

        selectionSnapshot.value = tempCtx.getImageData(0, 0, width, height)

        // Clear area on canvas (cut behavior)
        ctx.value!.save()
        ctx.value!.beginPath()
        ctx.value!.moveTo(lassoPoints.value[0].x, lassoPoints.value[0].y)
        lassoPoints.value.forEach(p => ctx.value!.lineTo(p.x, p.y))
        ctx.value!.closePath()
        ctx.value!.clip()
        ctx.value!.fillStyle = '#FFFFFF'
        ctx.value!.fillRect(Math.floor(minX), Math.floor(minY), width, height)
        ctx.value!.restore()

        snapshot.value = ctx.value!.getImageData(0, 0, canvasRef.value!.width, canvasRef.value!.height)
        drawSelectionMarquee()
      } else {
        selectionActive.value = false
        selectionRect.value = null
      }
    } else {
      saveToHistory()
    }
  }

  isDrawing.value = false
}

function drawSelectionMarquee() {
  if (!ctx.value || !selectionRect.value) return
  ctx.value.setLineDash([4, 4])
  ctx.value.strokeStyle = '#000000'
  ctx.value.lineWidth = 1
  ctx.value.strokeRect(selectionRect.value.x, selectionRect.value.y, selectionRect.value.width, selectionRect.value.height)
  ctx.value.setLineDash([])
}

function drawSpray(x: number, y: number) {
  if (!ctx.value) return
  const radius = currentLineWidth.value * 10
  const density = 20
  ctx.value.fillStyle = currentColor.value

  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * radius
    const px = x + Math.cos(angle) * dist
    const py = y + Math.sin(angle) * dist
    ctx.value.fillRect(px, py, 1, 1)
  }
}

function drawText(x: number, y: number) {
  const text = prompt('Enter text:')
  if (text && ctx.value) {
    ctx.value.font = `${currentLineWidth.value * 12}px Chicago, Geneva, sans-serif`
    ctx.value.fillStyle = currentColor.value
    ctx.value.fillText(text, x, y)
    saveToHistory()
  }
}

function drawRoundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  if (!ctx.value) return
  ctx.value.beginPath()
  ctx.value.moveTo(x + r, y)
  ctx.value.arcTo(x + w, y, x + w, y + h, r)
  ctx.value.arcTo(x + w, y + h, x, y + h, r)
  ctx.value.arcTo(x, y + h, x, y, r)
  ctx.value.arcTo(x, y, x + w, y, r)
  ctx.value.closePath()
}

function cutSelection() {
  if (selectionActive.value && selectionSnapshot.value) {
    clipboard.value = selectionSnapshot.value
    selectionActive.value = false
    selectionRect.value = null
    selectionSnapshot.value = null
    // Snapshot already cleared in stopDrawing
  }
}

function copySelection() {
  if (selectionActive.value && selectionSnapshot.value) {
    clipboard.value = selectionSnapshot.value
  }
}

function pasteSelection() {
  if (clipboard.value && ctx.value && canvasRef.value) {
    if (selectionActive.value) {
      finalizeSelection()
    }

    // Create new selection from clipboard
    selectionSnapshot.value = clipboard.value
    selectionRect.value = {
      x: 10,
      y: 10,
      width: clipboard.value.width,
      height: clipboard.value.height
    }
    selectionActive.value = true
    currentTool.value = 'select-rect'

    // Update snapshot for movement
    snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)

    // Draw for preview
    ctx.value.putImageData(selectionSnapshot.value, selectionRect.value.x, selectionRect.value.y)
    drawSelectionMarquee()
  }
}

function selectAll() {
  if (!canvasRef.value || !ctx.value) return
  if (selectionActive.value) {
    finalizeSelection()
  }

  currentTool.value = 'select-rect'
  selectionRect.value = {
    x: 0,
    y: 0,
    width: canvasRef.value.width,
    height: canvasRef.value.height
  }
  selectionSnapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  selectionActive.value = true

  // Clear canvas
  ctx.value.fillStyle = '#FFFFFF'
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)

  drawSelectionMarquee()
}

function saveToHistory() {
  if (!ctx.value || !canvasRef.value) return
  const imageData = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)

  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  history.value.push(imageData)
  if (history.value.length > maxHistory) {
    history.value.shift()
  } else {
    historyIndex.value++
  }
}

function undo() {
  if (historyIndex.value > 0 && ctx.value) {
    historyIndex.value--
    ctx.value.putImageData(history.value[historyIndex.value], 0, 0)
    snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value!.width, canvasRef.value!.height)
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1 && ctx.value) {
    historyIndex.value++
    ctx.value.putImageData(history.value[historyIndex.value], 0, 0)
    snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value!.width, canvasRef.value!.height)
  }
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
  snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
  saveToHistory()
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
          snapshot.value = ctx.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
          saveToHistory()
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
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @dblclick="finishPolygon"
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
  width: 56px;
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
  width: 22px;
  height: 22px;
  border: 1px solid var(--color-black);
  background-color: var(--color-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
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
  height: 14px;
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
  width: 22px;
  height: 22px;
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
  width: 22px;
  height: 22px;
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
