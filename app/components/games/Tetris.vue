<script setup lang="ts">
/**
 * Tetris Game Component
 *
 * A classic Tetris clone for Mac OS 7.
 */
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useWindowManager } from '~/composables/useWindowManager'
import { useSettings } from '~/composables/useSettings'

interface Props {
  isActive?: boolean
  windowId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  windowId: ''
})

const { updateWindow } = useWindowManager()
const { settings, updateAppData } = useSettings()

// Game constants
const COLS = 10
const ROWS = 20
const INITIAL_DROP_TIME = 800
const MIN_DROP_TIME = 100
const SPEED_INCREMENT = 0.9

// Types
type PieceType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z'
interface Piece {
  type: PieceType
  shape: number[][]
  color: string
}

const PIECES: Record<PieceType, Piece> = {
  'I': { type: 'I', shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: '#00FFFF' },
  'J': { type: 'J', shape: [[1,0,0], [1,1,1], [0,0,0]], color: '#0000FF' },
  'L': { type: 'L', shape: [[0,0,1], [1,1,1], [0,0,0]], color: '#FF7F00' },
  'O': { type: 'O', shape: [[1,1], [1,1]], color: '#FFFF00' },
  'S': { type: 'S', shape: [[0,1,1], [1,1,0], [0,0,0]], color: '#00FF00' },
  'T': { type: 'T', shape: [[0,1,0], [1,1,1], [0,0,0]], color: '#800080' },
  'Z': { type: 'Z', shape: [[1,1,0], [0,1,1], [0,0,0]], color: '#FF0000' }
}

// State
const grid = ref<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')))
const activePiece = ref<{ type: PieceType, shape: number[][], x: number, y: number } | null>(null)
const nextPieceType = ref<PieceType | null>(null)
const score = ref(0)
const lines = ref(0)
const level = ref(1)
const gameState = ref<'idle' | 'playing' | 'paused' | 'gameover'>('idle')
const dropTime = ref(INITIAL_DROP_TIME)

const highScore = ref(settings.value.appData?.tetris?.highScore || 0)

watch(score, (newScore) => {
  if (newScore > highScore.value) {
    highScore.value = newScore
    updateAppData('tetris', { highScore: newScore })
  }
})

let dropInterval: any = null

function initGame() {
  grid.value = Array.from({ length: ROWS }, () => Array(COLS).fill(''))
  score.value = 0
  lines.value = 0
  level.value = 1
  dropTime.value = INITIAL_DROP_TIME
  nextPieceType.value = getRandomPieceType()
  spawnPiece()
}

function getRandomPieceType(): PieceType {
  const types: PieceType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z']
  return types[Math.floor(Math.random() * types.length)]
}

function spawnPiece() {
  const type = nextPieceType.value || getRandomPieceType()
  const piece = PIECES[type]
  nextPieceType.value = getRandomPieceType()

  activePiece.value = {
    type: type,
    shape: piece.shape,
    x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
    y: 0
  }

  if (checkCollision(activePiece.value.x, activePiece.value.y, activePiece.value.shape)) {
    gameState.value = 'gameover'
    stopGame()
  }
}

function checkCollision(x: number, y: number, shape: number[][]) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = x + c
        const newY = y + r
        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid.value[newY][newX])) {
          return true
        }
      }
    }
  }
  return false
}

function rotatePiece() {
  if (!activePiece.value) return
  const shape = activePiece.value.shape
  const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse())
  if (!checkCollision(activePiece.value.x, activePiece.value.y, newShape)) {
    activePiece.value.shape = newShape
  }
}

function movePiece(dx: number, dy: number) {
  if (!activePiece.value || gameState.value !== 'playing') return
  if (!checkCollision(activePiece.value.x + dx, activePiece.value.y + dy, activePiece.value.shape)) {
    activePiece.value.x += dx
    activePiece.value.y += dy
    return true
  }
  if (dy > 0) {
    lockPiece()
  }
  return false
}

function lockPiece() {
  if (!activePiece.value) return
  const { shape, x, y } = activePiece.value
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        if (y + r >= 0) {
          grid.value[y + r][x + c] = activePiece.value!.type
        }
      }
    })
  })
  clearLines()
  spawnPiece()
}

function clearLines() {
  let clearedCount = 0
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid.value[r].every(cell => cell !== '')) {
      grid.value.splice(r, 1)
      grid.value.unshift(Array(COLS).fill(''))
      clearedCount++
      r++ // Check the same row again
    }
  }

  if (clearedCount > 0) {
    lines.value += clearedCount
    score.value += [0, 100, 300, 500, 800][clearedCount] * level.value
    const newLevel = Math.floor(lines.value / 10) + 1
    if (newLevel > level.value) {
      level.value = newLevel
      dropTime.value = Math.max(MIN_DROP_TIME, INITIAL_DROP_TIME * Math.pow(SPEED_INCREMENT, level.value - 1))
      startGameTimer()
    }
  }
}

function startGame() {
  if (gameState.value === 'playing') return
  if (gameState.value === 'gameover' || gameState.value === 'idle') {
    initGame()
  }
  gameState.value = 'playing'
  startGameTimer()
  updateWindowMenus()
}

function togglePause() {
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
    stopGameTimer()
  } else if (gameState.value === 'paused') {
    gameState.value = 'playing'
    startGameTimer()
  }
  updateWindowMenus()
}

function stopGame() {
  stopGameTimer()
  updateWindowMenus()
}

function startGameTimer() {
  stopGameTimer()
  dropInterval = setInterval(() => {
    movePiece(0, 1)
  }, dropTime.value)
}

function stopGameTimer() {
  if (dropInterval) {
    clearInterval(dropInterval)
    dropInterval = null
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (gameState.value !== 'playing') return
  switch (e.key) {
    case 'ArrowLeft': movePiece(-1, 0); break
    case 'ArrowRight': movePiece(1, 0); break
    case 'ArrowDown': movePiece(0, 1); break
    case 'ArrowUp': rotatePiece(); break
    case ' ':
      while(movePiece(0, 1)); // Hard drop
      break
    case 'p': togglePause(); break
  }
}

function updateWindowMenus() {
  if (!props.windowId) return
  updateWindow(props.windowId, {
    menus: [
      {
        id: 'game',
        label: 'Game',
        items: [
          { id: 'new-game', label: 'New Game', action: startGame },
          {
            id: 'pause',
            label: gameState.value === 'paused' ? 'Resume' : 'Pause',
            action: togglePause,
            disabled: gameState.value === 'idle' || gameState.value === 'gameover'
          }
        ]
      }
    ]
  })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (props.isActive) {
    updateWindowMenus()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  stopGameTimer()
})

watch(() => props.isActive, (active) => {
  if (active) {
    updateWindowMenus()
  } else if (gameState.value === 'playing') {
    togglePause()
  }
})

const displayGrid = computed(() => {
  const display = grid.value.map(row => [...row])
  if (activePiece.value && gameState.value === 'playing') {
    const { shape, x, y, type } = activePiece.value
    shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell && y + r >= 0 && y + r < ROWS && x + c >= 0 && x + c < COLS) {
          display[y + r][x + c] = type
        }
      })
    })
  }
  return display
})
</script>

<template>
  <div class="tetris no-select">
    <div class="tetris__main">
      <div class="tetris__board mac-inset-panel">
        <div v-for="(row, r) in displayGrid" :key="r" class="tetris__row">
          <div
            v-for="(cell, c) in row"
            :key="c"
            class="tetris__cell"
            :class="[cell ? `tetris__cell--${cell}` : '']"
          ></div>
        </div>

        <div v-if="gameState !== 'playing'" class="tetris__overlay">
          <div v-if="gameState === 'idle'" class="tetris__status">
            <h2>TETRIS</h2>
            <button class="mac-button" @click="startGame">Start Game</button>
          </div>
          <div v-else-if="gameState === 'paused'" class="tetris__status">
            <h2>PAUSED</h2>
            <button class="mac-button" @click="togglePause">Resume</button>
          </div>
          <div v-else-if="gameState === 'gameover'" class="tetris__status">
            <h2>GAME OVER</h2>
            <p>Score: {{ score }}</p>
            <button class="mac-button" @click="startGame">Try Again</button>
          </div>
        </div>
      </div>

      <div class="tetris__side">
        <div class="tetris__info-box mac-inset-panel">
          <div class="tetris__info-label">NEXT</div>
          <div class="tetris__next-piece">
            <div v-if="nextPieceType" class="tetris__next-grid">
              <div v-for="(row, r) in PIECES[nextPieceType].shape" :key="r" class="tetris__next-row">
                <div
                  v-for="(cell, c) in row"
                  :key="c"
                  class="tetris__cell"
                  :class="[cell ? `tetris__cell--${nextPieceType}` : 'tetris__cell--empty']"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="tetris__info-box mac-inset-panel mt-md">
          <div class="tetris__info-label">SCORE</div>
          <div class="tetris__info-value">{{ score }}</div>
        </div>

        <div class="tetris__info-box mac-inset-panel mt-md">
          <div class="tetris__info-label">HIGH SCORE</div>
          <div class="tetris__info-value">{{ highScore }}</div>
        </div>

        <div class="tetris__info-box mac-inset-panel mt-md">
          <div class="tetris__info-label">LEVEL</div>
          <div class="tetris__info-value">{{ level }}</div>
        </div>

        <div class="tetris__info-box mac-inset-panel mt-md">
          <div class="tetris__info-label">LINES</div>
          <div class="tetris__info-value">{{ lines }}</div>
        </div>
      </div>
    </div>

    <div class="tetris__controls mt-md">
      Arrows to move & rotate • Space to drop
    </div>
  </div>
</template>

<style scoped>
.tetris {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  font-family: var(--font-system);
  color: var(--color-black);
}

.tetris__main {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.tetris__board {
  position: relative;
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  display: flex;
  flex-direction: column;
}

.tetris__row {
  display: flex;
}

.tetris__cell {
  width: 15px;
  height: 15px;
  border: 1px solid #eee;
}

/* Piece colors - stylized for Mac OS 7 */
.tetris__cell--I { background-color: #000000; border-color: #666; }
.tetris__cell--J { background-color: #333333; border-color: #666; }
.tetris__cell--L { background-color: #666666; border-color: #999; }
.tetris__cell--O { background-color: #999999; border-color: #ccc; }
.tetris__cell--S { background-color: #000080; border-color: #333; }
.tetris__cell--T { background-color: #444444; border-color: #777; }
.tetris__cell--Z { background-color: #888888; border-color: #bbb; }

.tetris__cell--empty { border-color: transparent; }

.tetris__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tetris__status {
  text-align: center;
}

.tetris__status h2 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
}

.tetris__side {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tetris__info-box {
  background-color: var(--color-white);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-black);
}

.tetris__info-label {
  font-size: 9px;
  font-weight: bold;
  border-bottom: 1px solid var(--color-black);
  margin-bottom: var(--spacing-xs);
}

.tetris__info-value {
  text-align: right;
  font-size: var(--font-size-md);
}

.tetris__next-piece {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tetris__next-grid {
  display: flex;
  flex-direction: column;
}

.tetris__next-row {
  display: flex;
}

.tetris__controls {
  font-size: 9px;
  text-align: center;
  color: var(--color-gray-dark);
}
</style>
