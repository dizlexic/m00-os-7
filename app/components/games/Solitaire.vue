<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Rank = 'a' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'j' | 'q' | 'k'

interface Card {
  suit: Suit
  rank: Rank
  isFaceUp: boolean
  id: string
}

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k']

const deck = ref<Card[]>([])
const tableau = ref<Card[][]>([[], [], [], [], [], [], []])
const foundations = ref<Card[][]>([[], [], [], []])
const stock = ref<Card[]>([])
const waste = ref<Card[]>([])

const selectedCards = ref<{ cards: Card[], source: string, index?: number } | null>(null)

function createDeck() {
  const newDeck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      newDeck.push({
        suit,
        rank,
        isFaceUp: false,
        id: `${suit}_${rank}`
      })
    }
  }
  return newDeck
}

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
}

function startNewGame() {
  const newDeck = createDeck()
  shuffle(newDeck)

  // Deal tableau
  tableau.value = [[], [], [], [], [], [], []]
  for (let i = 0; i < 7; i++) {
    for (let j = i; j < 7; j++) {
      const card = newDeck.pop()!
      if (i === j) card.isFaceUp = true
      tableau.value[j].push(card)
    }
  }

  foundations.value = [[], [], [], []]
  waste.value = []
  stock.value = newDeck
  selectedCards.value = null
}

function getCardImage(card: Card) {
  if (!card.isFaceUp) return '/assets/cards/back.png'
  return `/assets/cards/${card.suit}_${card.rank}.png`
}

function handleStockClick() {
  if (stock.value.length === 0) {
    stock.value = waste.value.reverse().map(c => ({ ...c, isFaceUp: false }))
    waste.value = []
  } else {
    const card = stock.value.pop()!
    card.isFaceUp = true
    waste.value.push(card)
  }
  selectedCards.value = null
}

function canMoveToTableau(card: Card, targetPile: Card[]) {
  if (targetPile.length === 0) {
    return card.rank === 'k'
  }
  const topCard = targetPile[targetPile.length - 1]
  if (!topCard.isFaceUp) return false

  const isOppositeColor = (['hearts', 'diamonds'].includes(card.suit) !== ['hearts', 'diamonds'].includes(topCard.suit))
  const isOneLower = RANKS.indexOf(card.rank) === RANKS.indexOf(topCard.rank) - 1

  return isOppositeColor && isOneLower
}

function canMoveToFoundation(card: Card, foundationIndex: number) {
  const targetPile = foundations.value[foundationIndex]
  if (targetPile.length === 0) {
    return card.rank === 'a'
  }
  const topCard = targetPile[targetPile.length - 1]
  return card.suit === topCard.suit && RANKS.indexOf(card.rank) === RANKS.indexOf(topCard.rank) + 1
}

function handleCardClick(card: Card, source: string, index?: number) {
  if (!card.isFaceUp) {
    // Auto-flip top card of tableau if it's facedown
    if (source.startsWith('tableau-')) {
      const pileIndex = parseInt(source.split('-')[1])
      if (card === tableau.value[pileIndex][tableau.value[pileIndex].length - 1]) {
        card.isFaceUp = true
      }
    }
    return
  }

  if (selectedCards.value) {
    // Try to move selected cards to this target
    if (source.startsWith('tableau-')) {
      const targetPileIndex = parseInt(source.split('-')[1])
      if (canMoveToTableau(selectedCards.value.cards[0], tableau.value[targetPileIndex])) {
        moveSelectedCards('tableau', targetPileIndex)
        return
      }
    }
    selectedCards.value = null
  } else {
    // Select cards
    if (source === 'waste') {
      selectedCards.value = { cards: [card], source }
    } else if (source.startsWith('tableau-')) {
      const pileIndex = parseInt(source.split('-')[1])
      const cardIndex = tableau.value[pileIndex].indexOf(card)
      selectedCards.value = {
        cards: tableau.value[pileIndex].slice(cardIndex),
        source,
        index: cardIndex
      }
    }
  }
}

function handleFoundationClick(index: number) {
  if (selectedCards.value && selectedCards.value.cards.length === 1) {
    if (canMoveToFoundation(selectedCards.value.cards[0], index)) {
      moveSelectedCards('foundation', index)
    }
  }
}

function handleEmptyTableauClick(index: number) {
  if (selectedCards.value && selectedCards.value.cards[0].rank === 'k') {
    moveSelectedCards('tableau', index)
  }
}

function moveSelectedCards(targetType: 'tableau' | 'foundation', targetIndex: number) {
  if (!selectedCards.value) return

  const { cards, source } = selectedCards.value

  // Remove from source
  if (source === 'waste') {
    waste.value.pop()
  } else if (source.startsWith('tableau-')) {
    const sourcePileIndex = parseInt(source.split('-')[1])
    tableau.value[sourcePileIndex].splice(selectedCards.value.index!)

    // Flip new top card
    if (tableau.value[sourcePileIndex].length > 0) {
      tableau.value[sourcePileIndex][tableau.value[sourcePileIndex].length - 1].isFaceUp = true
    }
  }

  // Add to target
  if (targetType === 'tableau') {
    tableau.value[targetIndex].push(...cards)
  } else if (targetType === 'foundation') {
    foundations.value[targetIndex].push(cards[0])
  }

  selectedCards.value = null
  checkWin()
}

const isGameWon = ref(false)
function checkWin() {
  if (foundations.value.every(f => f.length === 13)) {
    isGameWon.value = true
  }
}

onMounted(() => {
  startNewGame()

  if (props.windowId) {
    updateWindow(props.windowId, {
      menus: [
        {
          id: 'solitaire',
          label: 'Solitaire',
          items: [
            { id: 'new-game', label: 'New Game', action: () => startNewGame() }
          ]
        }
      ]
    })
  }
})
</script>

<template>
  <div class="solitaire">
    <div class="solitaire__top-bar">
      <div class="solitaire__stock-waste">
        <div class="card-slot" @click="handleStockClick">
          <img v-if="stock.length > 0" src="/assets/cards/back.png" class="card" />
          <div v-else class="card-empty-slot stock-reload"></div>
        </div>
        <div class="card-slot">
          <img
            v-if="waste.length > 0"
            :src="getCardImage(waste[waste.length - 1])"
            class="card"
            :class="{ 'card--selected': selectedCards?.source === 'waste' }"
            @click="handleCardClick(waste[waste.length - 1], 'waste')"
          />
        </div>
      </div>

      <div class="solitaire__foundations">
        <div
          v-for="(pile, i) in foundations"
          :key="i"
          class="card-slot"
          @click="handleFoundationClick(i)"
        >
          <img v-if="pile.length > 0" :src="getCardImage(pile[pile.length - 1])" class="card" />
          <div v-else class="card-empty-slot foundation-slot"></div>
        </div>
      </div>
    </div>

    <div class="solitaire__tableau">
      <div
        v-for="(pile, i) in tableau"
        :key="i"
        class="tableau-pile"
        @click="pile.length === 0 && handleEmptyTableauClick(i)"
      >
        <div
          v-for="(card, j) in pile"
          :key="card.id"
          class="tableau-card"
          :style="{ top: j * 15 + 'px' }"
        >
          <img
            :src="getCardImage(card)"
            class="card"
            :class="{ 'card--selected': selectedCards?.cards.includes(card) }"
            @click.stop="handleCardClick(card, 'tableau-' + i, j)"
          />
        </div>
      </div>
    </div>

    <div v-if="isGameWon" class="win-message mac-window-shadow">
      <h2>Congratulations!</h2>
      <p>You won Solitaire!</p>
      <button class="mac-button" @click="startNewGame">New Game</button>
    </div>
  </div>
</template>

<style scoped>
.solitaire {
  background-color: #008000; /* Green table */
  height: 100%;
  padding: 10px;
  position: relative;
  overflow: hidden;
  user-select: none;
}

.solitaire__top-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.solitaire__stock-waste {
  display: flex;
  gap: 10px;
}

.solitaire__foundations {
  display: flex;
  gap: 10px;
}

.card-slot {
  width: 40px;
  height: 60px;
  position: relative;
}

.card {
  width: 40px;
  height: 60px;
  display: block;
  image-rendering: pixelated;
}

.card--selected {
  filter: brightness(0.8) sepia(1) hue-rotate(180deg) saturate(2);
}

.card-empty-slot {
  width: 40px;
  height: 60px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.stock-reload {
  background-color: rgba(255, 255, 255, 0.1);
}

.foundation-slot {
  background-color: rgba(255, 255, 255, 0.1);
}

.solitaire__tableau {
  display: flex;
  gap: 10px;
  height: 100%;
}

.tableau-pile {
  width: 40px;
  position: relative;
  min-height: 60px;
}

.tableau-card {
  position: absolute;
  width: 40px;
}

.win-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--color-white);
  padding: 20px;
  text-align: center;
  border: 1px solid var(--color-black);
  z-index: 100;
}
</style>
