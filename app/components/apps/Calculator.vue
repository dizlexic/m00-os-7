<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const display = ref('0')
const operand1 = ref<number | null>(null)
const operator = ref<string | null>(null)
const waitingForOperand = ref(false)
const memory = ref(0)

function handleNumber(num: string) {
  if (waitingForOperand.value) {
    display.value = num
    waitingForOperand.value = false
  } else {
    display.value = display.value === '0' ? num : display.value + num
  }
}

function handleDecimal() {
  if (waitingForOperand.value) {
    display.value = '0.'
    waitingForOperand.value = false
  } else if (!display.value.includes('.')) {
    display.value += '.'
  }
}

function handleOperator(nextOperator: string) {
  const inputValue = parseFloat(display.value)

  if (operand1.value === null) {
    operand1.value = inputValue
  } else if (operator.value) {
    const result = calculate(operand1.value, inputValue, operator.value)
    display.value = String(result)
    operand1.value = result
  }

  waitingForOperand.value = true
  operator.value = nextOperator
}

function calculate(op1: number, op2: number, op: string): number {
  switch (op) {
    case '+': return op1 + op2
    case '-': return op1 - op2
    case '*': return op1 * op2
    case '/': return op2 !== 0 ? op1 / op2 : 0
    case '%': return op1 * (op2 / 100)
    default: return op2
  }
}

function handleEquals() {
  if (operand1.value === null || !operator.value) return

  const inputValue = parseFloat(display.value)
  const result = calculate(operand1.value, inputValue, operator.value)
  display.value = String(result)
  operand1.value = null
  operator.value = null
  waitingForOperand.value = true
}

function handleClear() {
  display.value = '0'
  operand1.value = null
  operator.value = null
  waitingForOperand.value = false
}

function handleMemory(action: string) {
  const value = parseFloat(display.value)
  switch (action) {
    case 'MC': memory.value = 0; break
    case 'MR': display.value = String(memory.value); waitingForOperand.value = true; break
    case 'M+': memory.value += value; waitingForOperand.value = true; break
    case 'M-': memory.value -= value; waitingForOperand.value = true; break
  }
}

function handleKeyDown(event: KeyboardEvent) {
  const { key } = event
  if (/[0-9]/.test(key)) handleNumber(key)
  else if (key === '.') handleDecimal()
  else if (['+', '-', '*', '/'].includes(key)) handleOperator(key)
  else if (key === 'Enter' || key === '=') handleEquals()
  else if (key === 'Escape' || key === 'c' || key === 'C') handleClear()
  else if (key === '%') handleOperator('%')
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="calculator no-select">
    <div class="calculator__display">{{ display }}</div>
    <div class="calculator__buttons">
      <button class="calculator__button calculator__button--clear" @click="handleClear" data-value="C">C</button>
      <button class="calculator__button" @click="handleOperator('%')" data-value="%">%</button>
      <button class="calculator__button" @click="handleOperator('/')" data-value="/">/</button>
      <button class="calculator__button" @click="handleOperator('*')" data-value="*">*</button>

      <button class="calculator__button" @click="handleNumber('7')" data-value="7">7</button>
      <button class="calculator__button" @click="handleNumber('8')" data-value="8">8</button>
      <button class="calculator__button" @click="handleNumber('9')" data-value="9">9</button>
      <button class="calculator__button" @click="handleOperator('-')" data-value="-">-</button>

      <button class="calculator__button" @click="handleNumber('4')" data-value="4">4</button>
      <button class="calculator__button" @click="handleNumber('5')" data-value="5">5</button>
      <button class="calculator__button" @click="handleNumber('6')" data-value="6">6</button>
      <button class="calculator__button" @click="handleOperator('+')" data-value="+">+</button>

      <button class="calculator__button" @click="handleNumber('1')" data-value="1">1</button>
      <button class="calculator__button" @click="handleNumber('2')" data-value="2">2</button>
      <button class="calculator__button" @click="handleNumber('3')" data-value="3">3</button>
      <button class="calculator__button calculator__button--equals" @click="handleEquals" data-value="=">=</button>

      <button class="calculator__button calculator__button--zero" @click="handleNumber('0')" data-value="0">0</button>
      <button class="calculator__button" @click="handleDecimal" data-value=".">.</button>

      <button class="calculator__button calculator__button--memory" @click="handleMemory('MC')" data-value="MC">MC</button>
      <button class="calculator__button calculator__button--memory" @click="handleMemory('MR')" data-value="MR">MR</button>
      <button class="calculator__button calculator__button--memory" @click="handleMemory('M+')" data-value="M+">M+</button>
      <button class="calculator__button calculator__button--memory" @click="handleMemory('M-')" data-value="M-">M-</button>
    </div>
  </div>
</template>

<style scoped>
.calculator {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  background-color: var(--color-gray-light);
  width: 160px;
  height: 240px;
  border: 1px solid var(--color-black);
}

.calculator__display {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  padding: var(--spacing-xs) var(--spacing-sm);
  text-align: right;
  font-family: var(--font-system);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-md);
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

.calculator__buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  flex: 1;
}

.calculator__button {
  background-color: var(--color-white);
  border: 1px solid var(--color-black);
  box-shadow: inset -1px -1px 0 var(--color-gray-dark), inset 1px 1px 0 var(--color-white);
  font-family: var(--font-system);
  font-size: var(--font-size-md);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 28px;
}

.calculator__button:active {
  background-color: var(--color-black);
  color: var(--color-white);
  box-shadow: none;
}

.calculator__button--zero {
  grid-column: span 2;
}

.calculator__button--equals {
  grid-row: span 2;
  height: auto;
}

.calculator__button--clear {
  color: var(--color-red);
}
</style>
