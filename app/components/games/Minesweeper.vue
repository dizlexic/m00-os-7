<script setup lang="ts">
/**
 * Minesweeper Game Component
 *
 * A classic Minesweeper clone for Mac OS 7.
 */
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useWindowManager } from '~/composables/useWindowManager'
import { useAlert } from '~/composables/useAlert'

interface Props {
  isActive?: boolean
  windowId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  windowId: ''
})

const { updateWindow } = useWindowManager()
const { showAlert } = useAlert()

type CellStatus = 'hidden' | 'revealed' | 'flagged' | 'question' | 'exploded' | 'wrong-flag'

interface Cell {
  isMine: boolean
  neighborMines: number
  status: CellStatus
}

interface Difficulty {
  name: string
  rows: number
  cols: number
  mines: number
}

const DIFFICULTIES: Record<string, Difficulty> = {
  beginner: { name: 'Beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { name: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { name: 'Expert', rows: 16, cols: 30, mines: 99 }
}

const currentDifficultyKey = ref('beginner')
const currentDifficulty = computed(() => DIFFICULTIES[currentDifficultyKey.value])

const ROWS = computed(() => currentDifficulty.value.rows)
const COLS = computed(() => currentDifficulty.value.cols)
const MINES = computed(() => currentDifficulty.value.mines)

const grid = ref<Cell[][]>([])
const gameState = ref<'idle' | 'playing' | 'won' | 'lost'>('idle')
const minesLeft = ref(MINES.value)
const timer = ref(0)
let timerInterval: any = null

interface HighScore {
  name: string
  time: number
}

const bestTimes = ref<Record<string, HighScore>>({
  beginner: { name: 'Anonymous', time: 999 },
  intermediate: { name: 'Anonymous', time: 999 },
  expert: { name: 'Anonymous', time: 999 }
})

function loadHighScores() {
  const saved = localStorage.getItem('minesweeper-highscores')
  if (saved) {
    try {
      bestTimes.value = { ...bestTimes.value, ...JSON.parse(saved) }
    } catch (e) {
      console.error('Failed to load high scores', e)
    }
  }
}

function saveHighScores() {
  localStorage.setItem('minesweeper-highscores', JSON.stringify(bestTimes.value))
}

function checkHighScore() {
  const currentBest = bestTimes.value[currentDifficultyKey.value]
  if (timer.value < currentBest.time) {
    showAlert({
      title: 'New Record!',
      message: `You have the fastest time for ${currentDifficulty.value.name} level. Please enter your name:`,
      showInput: true,
      defaultValue: 'Anonymous',
      buttons: [{ label: 'OK', value: 'ok', isDefault: true }],
      onClose: (value, name) => {
        bestTimes.value[currentDifficultyKey.value] = {
          name: name || 'Anonymous',
          time: timer.value
        }
        saveHighScores()
        showBestTimes()
      }
    })
  }
}

function showBestTimes() {
  const message = Object.entries(DIFFICULTIES).map(([key, diff]) => {
    const score = bestTimes.value[key]
    return `${diff.name}: ${score.time} seconds (${score.name})`
  }).join('\n')

  showAlert({
    title: 'Best Times',
    message,
    buttons: [
      { label: 'Reset Scores', value: 'reset' },
      { label: 'OK', value: 'ok', isDefault: true }
    ],
    onClose: (value) => {
      if (value === 'reset') {
        bestTimes.value = {
          beginner: { name: 'Anonymous', time: 999 },
          intermediate: { name: 'Anonymous', time: 999 },
          expert: { name: 'Anonymous', time: 999 }
        }
        saveHighScores()
      }
    }
  })
}

function initGrid() {
  const rows = ROWS.value
  const cols = COLS.value
  const newGrid: Cell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = []
    for (let c = 0; c < cols; c++) {
      row.push({
        isMine: false,
        neighborMines: 0,
        status: 'hidden'
      })
    }
    newGrid.push(row)
  }
  grid.value = newGrid
  gameState.value = 'idle'
  minesLeft.value = MINES.value
  timer.value = 0
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function startTimer() {
  if (timerInterval) return
  timerInterval = setInterval(() => {
    if (timer.value < 999) {
      timer.value++
    }
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function placeMines(firstR: number, firstC: number) {
  let placed = 0
  const rows = ROWS.value
  const cols = COLS.value
  const mines = MINES.value

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)

    // Don't place mine on first click or already placed mine
    if ((r === firstR && c === firstC) || grid.value[r][c].isMine) {
      continue
    }

    grid.value[r][c].isMine = true
    placed++
  }

  // Calculate neighbor counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid.value[r][c].isMine) {
        grid.value[r][c].neighborMines = countNeighborMines(r, c)
      }
    }
  }
}

function countNeighborMines(r: number, c: number): number {
  let count = 0
  const rows = ROWS.value
  const cols = COLS.value

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid.value[nr][nc].isMine) {
        count++
      }
    }
  }
  return count
}

function revealCell(r: number, c: number) {
  if (gameState.value === 'won' || gameState.value === 'lost') return

  const cell = grid.value[r][c]
  if (cell.status !== 'hidden') return

  if (gameState.value === 'idle') {
    gameState.value = 'playing'
    placeMines(r, c)
    startTimer()
  }

  if (cell.isMine) {
    cell.status = 'exploded'
    gameOver(false)
    return
  }

  cell.status = 'revealed'

  if (cell.neighborMines === 0) {
    // Reveal neighbors
    const rows = ROWS.value
    const cols = COLS.value

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          revealCell(nr, nc)
        }
      }
    }
  }

  checkWin()
}

function toggleFlag(r: number, c: number, event: Event) {
  event.preventDefault()
  if (gameState.value === 'lost' || gameState.value === 'won') return

  const cell = grid.value[r][c]
  if (cell.status === 'revealed') return

  if (cell.status === 'hidden') {
    cell.status = 'flagged'
    minesLeft.value--
  } else if (cell.status === 'flagged') {
    cell.status = 'question'
    minesLeft.value++
  } else if (cell.status === 'question') {
    cell.status = 'hidden'
  }
}

function checkWin() {
  let hiddenNonMines = 0
  const rows = ROWS.value
  const cols = COLS.value

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid.value[r][c].isMine && grid.value[r][c].status !== 'revealed') {
        hiddenNonMines++
      }
    }
  }

  if (hiddenNonMines === 0) {
    gameState.value = 'won'
    stopTimer()
    // Flag all remaining mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid.value[r][c].isMine) {
          grid.value[r][c].status = 'flagged'
        }
      }
    }
    minesLeft.value = 0
    checkHighScore()
  }
}

function gameOver(won: boolean) {
  gameState.value = won ? 'won' : 'lost'
  stopTimer()

  const rows = ROWS.value
  const cols = COLS.value

  if (!won) {
    // Reveal all mines
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid.value[r][c]
        if (cell.isMine && cell.status !== 'exploded') {
          cell.status = 'revealed'
        } else if (!cell.isMine && cell.status === 'flagged') {
          cell.status = 'wrong-flag'
        }
      }
    }
  }
}

function handleReset() {
  initGrid()
}

function changeDifficulty(key: string) {
  currentDifficultyKey.value = key
  initGrid()
  updateWindowMenus()

  // Calculate window size based on grid
  // Cell is 20px, border is 2px each side = 24px per cell? No, let's check CSS.
  // .minesweeper__cell is 20x20 with 2px border.
  // So each cell is 20px wide (border-box by default in Nuxt/Tailwind? No, standard CSS).
  // width: 20px; height: 20px; border: 2px solid;
  // So total cell width is 20 + 2 + 2 = 24px.

  const cellTotalSize = 20
  const gridWidth = COLS.value * cellTotalSize + 20 // padding/borders
  const gridHeight = ROWS.value * cellTotalSize + 80 // header + padding/borders

  if (props.windowId) {
    updateWindow(props.windowId, {
      size: { width: Math.max(220, gridWidth), height: Math.max(300, gridHeight) }
    })
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
          { id: 'new-game', label: 'New Game', action: handleReset },
          { id: 'sep1', label: '', isSeparator: true },
          { id: 'close', label: 'Close', action: () => { /* Handled by window manager */ } }
        ]
      },
      {
        id: 'game',
        label: 'Game',
        items: [
          {
            id: 'beginner',
            label: 'Beginner',
            action: () => changeDifficulty('beginner'),
            checked: currentDifficultyKey.value === 'beginner'
          },
          {
            id: 'intermediate',
            label: 'Intermediate',
            action: () => changeDifficulty('intermediate'),
            checked: currentDifficultyKey.value === 'intermediate'
          },
          {
            id: 'expert',
            label: 'Expert',
            action: () => changeDifficulty('expert'),
            checked: currentDifficultyKey.value === 'expert'
          },
          { id: 'sep2', label: '', isSeparator: true },
          { id: 'best-times', label: 'Best Times...', action: showBestTimes }
        ]
      }
    ]
  })
}

watch(() => props.isActive, (active) => {
  if (active) {
    updateWindowMenus()
  }
})

initGrid()
loadHighScores()

onMounted(() => {
  if (props.isActive) {
    updateWindowMenus()
  }
})

onBeforeUnmount(() => {
  stopTimer()
})

const faceIcon = computed(() => {
  if (gameState.value === 'won') return '😎'
  if (gameState.value === 'lost') return '😵'
  return '😊'
})

</script>

<template>
  <div class="minesweeper">
    <div class="minesweeper__container">
      <div class="minesweeper__header">
        <div class="minesweeper__digit-display">{{ String(Math.max(0, minesLeft)).padStart(3, '0') }}</div>
        <button class="minesweeper__reset-button" @click="handleReset">
          {{ faceIcon }}
        </button>
        <div class="minesweeper__digit-display">{{ String(timer).padStart(3, '0') }}</div>
      </div>

      <div class="minesweeper__grid" @contextmenu.prevent>
        <div v-for="(row, r) in grid" :key="r" class="minesweeper__row">
          <div
            v-for="(cell, c) in row"
            :key="c"
            class="minesweeper__cell"
            :class="[
              `minesweeper__cell--${cell.status}`,
              { 'minesweeper__cell--mine': cell.status === 'revealed' && cell.isMine }
            ]"
            @mousedown="cell.status === 'hidden' && gameState !== 'lost' && gameState !== 'won'"
            @mouseup="revealCell(r, c)"
            @contextmenu="toggleFlag(r, c, $event)"
          >
            <template v-if="cell.status === 'revealed' && !cell.isMine && cell.neighborMines > 0">
              <span :class="`minesweeper__number--${cell.neighborMines}`">{{ cell.neighborMines }}</span>
            </template>
            <template v-if="cell.status === 'exploded' || (cell.status === 'revealed' && cell.isMine)">
              💣
            </template>
            <template v-if="cell.status === 'flagged'">
              🚩
            </template>
            <template v-if="cell.status === 'question'">
              ?
            </template>
            <template v-if="cell.status === 'wrong-flag'">
              ❌
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.minesweeper {
  padding: var(--spacing-sm);
  background-color: var(--color-gray-light);
  display: flex;
  justify-content: center;
  user-select: none;
}

.minesweeper__container {
  border: 3px solid;
  border-color: var(--color-gray-dark) var(--color-white) var(--color-white) var(--color-gray-dark);
  padding: 6px;
}

.minesweeper__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  margin-bottom: 6px;
  border: 2px solid;
  border-color: var(--color-gray-dark) var(--color-white) var(--color-white) var(--color-gray-dark);
}

.minesweeper__digit-display {
  background-color: var(--color-black);
  color: var(--color-red);
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  padding: 2px 4px;
  font-weight: bold;
  line-height: 1;
  border: 1px solid var(--color-gray-dark);
  text-shadow: 0 0 2px var(--color-red);
  min-width: 50px;
  text-align: right;
}

.minesweeper__reset-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background-color: var(--color-gray-light);
  border: 2px solid;
  border-color: var(--color-white) var(--color-gray-dark) var(--color-gray-dark) var(--color-white);
  cursor: pointer;
}

.minesweeper__reset-button:active {
  border-color: var(--color-gray-dark) var(--color-white) var(--color-white) var(--color-gray-dark);
  padding-top: 2px;
  padding-left: 2px;
}

.minesweeper__grid {
  border: 3px solid;
  border-color: var(--color-gray-dark) var(--color-white) var(--color-white) var(--color-gray-dark);
  background-color: var(--color-gray-medium);
}

.minesweeper__row {
  display: flex;
}

.minesweeper__cell {
  width: 20px;
  height: 20px;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-system);
  font-size: 14px;
  font-weight: bold;
  box-sizing: border-box;
}

.minesweeper__cell--hidden,
.minesweeper__cell--flagged,
.minesweeper__cell--question,
.minesweeper__cell--wrong-flag {
  background-color: var(--color-gray-light);
  border-color: var(--color-white) var(--color-gray-dark) var(--color-gray-dark) var(--color-white);
}

.minesweeper__cell--revealed,
.minesweeper__cell--exploded {
  background-color: var(--color-gray-light);
  border: 1px solid var(--color-gray-medium);
}

.minesweeper__cell--exploded {
  background-color: var(--color-red);
}

.minesweeper__number--1 { color: #0000FF; }
.minesweeper__number--2 { color: #008000; }
.minesweeper__number--3 { color: #FF0000; }
.minesweeper__number--4 { color: #000080; }
.minesweeper__number--5 { color: #800000; }
.minesweeper__number--6 { color: #008080; }
.minesweeper__number--7 { color: #000000; }
.minesweeper__number--8 { color: #808080; }
</style>
