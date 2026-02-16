<script setup lang="ts">
/**
 * Minesweeper Game Component
 *
 * A classic Minesweeper clone for Mac OS 7.
 */
import { ref, onMounted, computed } from 'vue'

interface Props {
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

type CellStatus = 'hidden' | 'revealed' | 'flagged' | 'exploded' | 'wrong-flag'

interface Cell {
  isMine: boolean
  neighborMines: number
  status: CellStatus
}

const ROWS = 9
const COLS = 9
const MINES = 10

const grid = ref<Cell[][]>([])
const gameState = ref<'idle' | 'playing' | 'won' | 'lost'>('idle')
const minesLeft = ref(MINES)
const timer = ref(0)
let timerInterval: number | null = null

function initGrid() {
  const newGrid: Cell[][] = []
  for (let r = 0; r < ROWS; r++) {
    const row: Cell[] = []
    for (let c = 0; c < COLS; c++) {
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
  minesLeft.value = MINES
  timer.value = 0
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

function startTimer() {
  if (timerInterval) return
  timerInterval = window.setInterval(() => {
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
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)

    // Don't place mine on first click or already placed mine
    if ((r === firstR && c === firstC) || grid.value[r][c].isMine) {
      continue
    }

    grid.value[r][c].isMine = true
    placed++
  }

  // Calculate neighbor counts
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid.value[r][c].isMine) {
        grid.value[r][c].neighborMines = countNeighborMines(r, c)
      }
    }
  }
}

function countNeighborMines(r: number, c: number): number {
  let count = 0
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid.value[nr][nc].isMine) {
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
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr
        const nc = c + dc
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
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
    cell.status = 'hidden'
    minesLeft.value++
  }
}

function checkWin() {
  let hiddenNonMines = 0
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid.value[r][c].isMine && grid.value[r][c].status !== 'revealed') {
        hiddenNonMines++
      }
    }
  }

  if (hiddenNonMines === 0) {
    gameState.value = 'won'
    stopTimer()
    // Flag all remaining mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid.value[r][c].isMine) {
          grid.value[r][c].status = 'flagged'
        }
      }
    }
    minesLeft.value = 0
  }
}

function gameOver(won: boolean) {
  gameState.value = won ? 'won' : 'lost'
  stopTimer()

  if (!won) {
    // Reveal all mines
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
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

initGrid()

onMounted(() => {
  // initGrid already called in setup
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
}

.minesweeper__reset-button {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background-color: var(--color-gray-light);
  border: 2px solid;
  border-color: var(--color-white) var(--color-gray-dark) var(--color-gray-dark) var(--color-white);
}

.minesweeper__reset-button:active {
  border-color: var(--color-gray-dark) var(--color-white) var(--color-white) var(--color-gray-dark);
}

.minesweeper__grid {
  border: 3px solid;
  border-color: var(--color-gray-dark) var(--color-white) var(--color-white) var(--color-gray-dark);
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
}

.minesweeper__cell--hidden,
.minesweeper__cell--flagged,
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
