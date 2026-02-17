<script setup lang="ts">
/**
 * Brickle (Breakout) Game Component
 *
 * A classic Breakout game for m00-os-7.
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useWindowManager } from '~/composables/useWindowManager'
import { useDesktop } from '~/composables/useDesktop'

interface Props {
  isActive?: boolean
  windowId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  windowId: ''
})

const { updateWindow } = useWindowManager()
const { showContextMenu } = useDesktop()

const canvas = ref<HTMLCanvasElement | null>(null)
const container = ref<HTMLElement | null>(null)
const gameState = ref<'idle' | 'playing' | 'paused' | 'gameover' | 'won'>('idle')
const score = ref(0)
const lives = ref(3)
const level = ref(1)

// Game constants
const PADDLE_WIDTH = 60
const PADDLE_HEIGHT = 10
const BALL_RADIUS = 4
const BRICK_ROWS = 5
const BRICK_COLS = 8
const BRICK_PADDING = 5
const BRICK_OFFSET_TOP = 30
const BRICK_OFFSET_LEFT = 15
const BRICK_HEIGHT = 12

// Game variables
let paddleX = 0
let ballX = 0
let ballY = 0
let dx = 2
let dy = -2
let bricks: { x: number; y: number; status: number }[][] = []
let animationId: number | null = null
let canvasWidth = 0
let canvasHeight = 0

function initBricks() {
  bricks = []
  const availableWidth = canvasWidth - (BRICK_OFFSET_LEFT * 2)
  const brickWidth = (availableWidth - (BRICK_COLS - 1) * BRICK_PADDING) / BRICK_COLS

  for (let c = 0; c < BRICK_COLS; c++) {
    bricks[c] = []
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 }
    }
  }
}

function startGame() {
  if (gameState.value === 'playing') return

  if (gameState.value === 'gameover' || gameState.value === 'won') {
    score.value = 0
    lives.value = 3
    level.value = 1
  }

  initBricks()
  resetBall()
  gameState.value = 'playing'
  draw()
}

function togglePause() {
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
    if (animationId) cancelAnimationFrame(animationId)
  } else if (gameState.value === 'paused') {
    gameState.value = 'playing'
    draw()
  }
}

function resetBall() {
  ballX = canvasWidth / 2
  ballY = canvasHeight - 30
  dx = 2 * (Math.random() > 0.5 ? 1 : -1)
  dy = -2
  paddleX = (canvasWidth - PADDLE_WIDTH) / 2
}

function drawBall(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2)
  ctx.fillStyle = "#000000"
  ctx.fill()
  ctx.closePath()
}

function drawPaddle(ctx: CanvasRenderingContext2D) {
  ctx.beginPath()
  ctx.rect(paddleX, canvasHeight - PADDLE_HEIGHT - 5, PADDLE_WIDTH, PADDLE_HEIGHT)
  ctx.fillStyle = "#000000"
  ctx.fill()
  ctx.closePath()

  // Add a highlight to make it look 3D-ish
  ctx.strokeStyle = "#ffffff"
  ctx.lineWidth = 1
  ctx.strokeRect(paddleX + 1, canvasHeight - PADDLE_HEIGHT - 4, PADDLE_WIDTH - 2, PADDLE_HEIGHT - 2)
}

function drawBricks(ctx: CanvasRenderingContext2D) {
  const availableWidth = canvasWidth - (BRICK_OFFSET_LEFT * 2)
  const brickWidth = (availableWidth - (BRICK_COLS - 1) * BRICK_PADDING) / BRICK_COLS

  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + BRICK_PADDING) + BRICK_OFFSET_LEFT
        const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP
        bricks[c][r].x = brickX
        bricks[c][r].y = brickY

        ctx.beginPath()
        ctx.rect(brickX, brickY, brickWidth, BRICK_HEIGHT)

        // Classic Mac dithered or colored patterns
        const colors = ["#000000", "#666666", "#999999", "#CCCCCC", "#000080"]
        ctx.fillStyle = colors[r % colors.length]

        ctx.fill()
        ctx.strokeStyle = "#000000"
        ctx.strokeRect(brickX, brickY, brickWidth, BRICK_HEIGHT)
        ctx.closePath()
      }
    }
  }
}

function collisionDetection() {
  const availableWidth = canvasWidth - (BRICK_OFFSET_LEFT * 2)
  const brickWidth = (availableWidth - (BRICK_COLS - 1) * BRICK_PADDING) / BRICK_COLS

  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      const b = bricks[c][r]
      if (b.status === 1) {
        if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + BRICK_HEIGHT) {
          dy = -dy
          b.status = 0
          score.value += 10

          if (isLevelComplete()) {
            gameState.value = 'won'
            if (animationId) cancelAnimationFrame(animationId)
          }
        }
      }
    }
  }
}

function isLevelComplete() {
  for (let c = 0; c < BRICK_COLS; c++) {
    for (let r = 0; r < BRICK_ROWS; r++) {
      if (bricks[c][r].status === 1) return false
    }
  }
  return true
}

function draw() {
  if (gameState.value !== 'playing') return

  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  drawBricks(ctx)
  drawBall(ctx)
  drawPaddle(ctx)
  collisionDetection()

  // Wall collisions
  if (ballX + dx > canvasWidth - BALL_RADIUS || ballX + dx < BALL_RADIUS) {
    dx = -dx
  }
  if (ballY + dy < BALL_RADIUS) {
    dy = -dy
  } else if (ballY + dy > canvasHeight - BALL_RADIUS - PADDLE_HEIGHT - 5) {
    if (ballX > paddleX && ballX < paddleX + PADDLE_WIDTH) {
      dy = -dy
      // Add some variety to bounce based on where it hits the paddle
      const hitPos = (ballX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2)
      dx = hitPos * 3
    } else if (ballY + dy > canvasHeight - BALL_RADIUS) {
      lives.value--
      if (!lives.value) {
        gameState.value = 'gameover'
        if (animationId) cancelAnimationFrame(animationId)
        return
      } else {
        resetBall()
      }
    }
  }

  ballX += dx
  ballY += dy

  animationId = requestAnimationFrame(draw)
}

function handleMouseMove(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const relativeX = e.clientX - rect.left
  if (relativeX > 0 && relativeX < canvasWidth) {
    paddleX = relativeX - PADDLE_WIDTH / 2

    // Keep paddle within bounds
    if (paddleX < 0) paddleX = 0
    if (paddleX > canvasWidth - PADDLE_WIDTH) paddleX = canvasWidth - PADDLE_WIDTH
  }
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault()
  const items = [
    {
      id: 'pause',
      label: gameState.value === 'paused' ? 'Resume Game' : 'Pause Game',
      disabled: gameState.value === 'idle' || gameState.value === 'gameover' || gameState.value === 'won',
      action: togglePause
    },
    { id: 'sep1', label: '', isSeparator: true },
    { id: 'new-game', label: 'New Game', action: startGame }
  ]
  showContextMenu({ x: e.clientX, y: e.clientY }, items)
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.isActive) return

  if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
    if (gameState.value === 'playing' || gameState.value === 'paused') {
      togglePause()
    }
  }
}

function updateWindowMenus() {
  if (!props.windowId) return

  updateWindow(props.windowId, {
    menus: [
      {
        id: 'file',
        label: 'File',
        items: [
          { id: 'new-game', label: 'New Game', action: startGame },
          { id: 'sep1', label: '', isSeparator: true },
          { id: 'close', label: 'Close', action: () => { /* Handled by window manager */ } }
        ]
      },
      {
        id: 'game',
        label: 'Game',
        items: [
          {
            id: 'pause',
            label: gameState.value === 'paused' ? 'Resume Game' : 'Pause Game',
            shortcut: 'P',
            disabled: gameState.value === 'idle' || gameState.value === 'gameover' || gameState.value === 'won',
            action: togglePause
          },
          { id: 'sep2', label: '', isSeparator: true },
          { id: 'start-game', label: 'Start New Game', action: startGame }
        ]
      }
    ]
  })
}

onMounted(() => {
  if (canvas.value) {
    canvasWidth = canvas.value.width
    canvasHeight = canvas.value.height
    initBricks()
    resetBall()
  }
  window.addEventListener('keydown', handleKeydown)
  if (props.isActive) {
    updateWindowMenus()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('keydown', handleKeydown)
})

watch(gameState, () => {
  updateWindowMenus()
})

// Pause game when window is not active
watch(() => props.isActive, (active) => {
  if (active) {
    updateWindowMenus()
  }
  if (!active && gameState.value === 'playing') {
    gameState.value = 'paused'
    if (animationId) cancelAnimationFrame(animationId)
  }
})
</script>

<template>
  <div ref="container" class="brickle" @mousemove="handleMouseMove" @contextmenu="handleContextMenu">
    <div class="brickle__header">
      <div class="brickle__info">
        <span>Score: {{ score }}</span>
        <span>Lives: {{ lives }}</span>
      </div>
      <div class="brickle__level">Level: {{ level }}</div>
    </div>

    <div class="brickle__canvas-container">
      <canvas
        ref="canvas"
        width="370"
        height="300"
        class="brickle__canvas"
      ></canvas>

      <div v-if="gameState !== 'playing'" class="brickle__overlay">
        <div v-if="gameState === 'idle'" class="brickle__message">
          <h2>BRICKLE</h2>
          <p>Press start to begin</p>
          <button class="mac-button" @click="startGame">Start Game</button>
        </div>
        <div v-else-if="gameState === 'paused'" class="brickle__message">
          <h2>PAUSED</h2>
          <button class="mac-button" @click="gameState = 'playing'; draw()">Resume</button>
        </div>
        <div v-else-if="gameState === 'gameover'" class="brickle__message">
          <h2>GAME OVER</h2>
          <p>Final Score: {{ score }}</p>
          <button class="mac-button" @click="startGame">Try Again</button>
        </div>
        <div v-else-if="gameState === 'won'" class="brickle__message">
          <h2>YOU WON!</h2>
          <p>Level {{ level }} Complete!</p>
          <p>Score: {{ score }}</p>
          <button class="mac-button" @click="startGame">Next Level</button>
        </div>
      </div>
    </div>

    <div class="brickle__footer">
      <p>Use your mouse to move the paddle</p>
    </div>
  </div>
</template>

<style scoped>
.brickle {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-gray-light);
  padding: var(--spacing-md);
  user-select: none;
}

.brickle__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  border: 1px solid var(--color-black);
  background: var(--color-white);
  padding: var(--spacing-xs) var(--spacing-sm);
}

.brickle__info {
  display: flex;
  gap: var(--spacing-lg);
}

.brickle__canvas-container {
  position: relative;
  border: 2px solid var(--color-black);
  background-color: var(--color-white);
  overflow: hidden;
}

.brickle__canvas {
  display: block;
  cursor: none; /* Hide cursor when over game board */
}

.brickle__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.brickle__message h2 {
  font-family: var(--font-system);
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-md);
}

.brickle__message p {
  font-family: var(--font-system);
  margin-bottom: var(--spacing-md);
}

.brickle__footer {
  margin-top: var(--spacing-md);
  font-family: var(--font-system);
  font-size: var(--font-size-sm);
  text-align: center;
  color: var(--color-gray-dark);
}

.mac-button {
  min-width: 80px;
}
</style>
