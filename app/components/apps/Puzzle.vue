<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useWindowManager } from '~/composables/useWindowManager'

interface Props {
  isActive?: boolean
  windowId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  windowId: ''
})

const { updateWindow } = useWindowManager()

const GRID_SIZE = 4
const TOTAL_TILES = GRID_SIZE * GRID_SIZE

// Tiles array: 1-15 are numbered tiles, 0 is the empty space
const tiles = ref<number[]>([])
const moves = ref(0)
const isWon = ref(false)

const isSolved = computed(() => {
  for (let i = 0; i < TOTAL_TILES - 1; i++) {
    if (tiles.value[i] !== i + 1) return false
  }
  return tiles.value[TOTAL_TILES - 1] === 0
})

function initializePuzzle() {
  // Create solved state first
  tiles.value = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1)
  tiles.value.push(0) // Empty space at the end
  moves.value = 0
  isWon.value = false
}

function shufflePuzzle() {
  // Perform random valid moves to shuffle (ensures solvability)
  initializePuzzle()

  const numShuffles = 100
  for (let i = 0; i < numShuffles; i++) {
    const emptyIndex = tiles.value.indexOf(0)
    const validMoves = getValidMoves(emptyIndex)
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
    swapTiles(emptyIndex, randomMove)
  }

  moves.value = 0
  isWon.value = false
}

function getValidMoves(emptyIndex: number): number[] {
  const moves: number[] = []
  const row = Math.floor(emptyIndex / GRID_SIZE)
  const col = emptyIndex % GRID_SIZE

  // Up
  if (row > 0) moves.push(emptyIndex - GRID_SIZE)
  // Down
  if (row < GRID_SIZE - 1) moves.push(emptyIndex + GRID_SIZE)
  // Left
  if (col > 0) moves.push(emptyIndex - 1)
  // Right
  if (col < GRID_SIZE - 1) moves.push(emptyIndex + 1)

  return moves
}

function swapTiles(index1: number, index2: number) {
  const temp = tiles.value[index1]
  tiles.value[index1] = tiles.value[index2]
  tiles.value[index2] = temp
}

function handleTileClick(index: number) {
  if (isWon.value) return

  const emptyIndex = tiles.value.indexOf(0)
  const validMoves = getValidMoves(emptyIndex)

  if (validMoves.includes(index)) {
    swapTiles(emptyIndex, index)
    moves.value++

    if (isSolved.value) {
      isWon.value = true
    }
  }
}

function getTileStyle(index: number) {
  const tile = tiles.value[index]
  if (tile === 0) return {}

  // Classic Mac colors for tiles
  return {
    backgroundColor: '#ffffff',
    border: '2px outset #cccccc'
  }
}

onMounted(() => {
  shufflePuzzle()

  if (props.windowId) {
    updateWindow(props.windowId, {
      menus: [
        {
          id: 'puzzle',
          label: 'Puzzle',
          items: [
            { id: 'new-game', label: 'New Game', action: () => shufflePuzzle() }
          ]
        }
      ]
    })
  }
})
</script>

<template>
  <div class="puzzle">
    <div class="puzzle__header">
      <span class="puzzle__moves">Moves: {{ moves }}</span>
      <button class="puzzle__btn" @click="shufflePuzzle">New Game</button>
    </div>

    <div class="puzzle__board">
      <div
        v-for="(tile, index) in tiles"
        :key="index"
        class="puzzle__tile"
        :class="{
          'puzzle__tile--empty': tile === 0,
          'puzzle__tile--clickable': getValidMoves(tiles.indexOf(0)).includes(index)
        }"
        :style="getTileStyle(index)"
        @click="handleTileClick(index)"
      >
        <span v-if="tile !== 0" class="puzzle__tile-number">{{ tile }}</span>
      </div>
    </div>

    <div v-if="isWon" class="puzzle__win">
      🎉 Congratulations! 🎉
      <br>
      Solved in {{ moves }} moves!
    </div>
  </div>
</template>

<style scoped>
.puzzle {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  height: 100%;
  background: var(--color-gray-light, #cccccc);
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-md, 12px);
  box-sizing: border-box;
}

.puzzle__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 160px;
  margin-bottom: 8px;
}

.puzzle__moves {
  font-size: var(--font-size-sm, 9px);
}

.puzzle__btn {
  padding: 2px 8px;
  border: 1px solid var(--color-black, #000000);
  background: var(--color-white, #ffffff);
  cursor: pointer;
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-sm, 9px);
}

.puzzle__btn:active {
  background: var(--color-black, #000000);
  color: var(--color-white, #ffffff);
}

.puzzle__board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 2px;
  width: 160px;
  height: 160px;
  padding: 4px;
  background: var(--color-black, #000000);
  border: 2px inset var(--color-gray-medium, #999999);
}

.puzzle__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-white, #ffffff);
  cursor: default;
  user-select: none;
}

.puzzle__tile--empty {
  background: var(--color-black, #000000) !important;
  border: none !important;
}

.puzzle__tile--clickable {
  cursor: pointer;
}

.puzzle__tile--clickable:hover {
  background: var(--color-gray-light, #cccccc) !important;
}

.puzzle__tile-number {
  font-size: 14px;
  font-weight: bold;
  color: var(--color-black, #000000);
}

.puzzle__win {
  margin-top: 12px;
  padding: 8px;
  text-align: center;
  background: var(--color-white, #ffffff);
  border: 2px solid var(--color-black, #000000);
  font-size: var(--font-size-sm, 9px);
}
</style>
