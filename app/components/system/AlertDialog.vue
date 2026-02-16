<script setup lang="ts">
/**
 * AlertDialog Component
 *
 * Mac OS 7 style alert dialog with modal overlay, icon display,
 * message text, and configurable buttons.
 */

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSettings } from '~/composables/useSettings'
import { useSound } from '~/composables/useSound'

/** Button configuration for the alert dialog */
export interface AlertButton {
  /** Button label text */
  label: string
  /** Value emitted when button is clicked */
  value: string
  /** Whether this is the default button (responds to Enter key) */
  isDefault?: boolean
}

/** Alert dialog type determines the icon displayed */
export type AlertType = 'stop' | 'caution' | 'note'

interface Props {
  /** The message to display in the dialog */
  message: string
  /** Optional title for the dialog */
  title?: string
  /** Type of alert - determines icon (stop, caution, note) */
  type?: AlertType
  /** Array of button configurations */
  buttons?: readonly AlertButton[]
  /** Whether clicking the overlay dismisses the dialog */
  dismissible?: boolean
  /** Whether to show an input field (prompt variant) */
  showInput?: boolean
  /** Default value for the input field */
  defaultValue?: string
  /** Placeholder for the input field */
  inputPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'note',
  buttons: () => [{ label: 'OK', value: 'ok', isDefault: true }],
  dismissible: false,
  showInput: false,
  defaultValue: '',
  inputPlaceholder: ''
})

const emit = defineEmits<{
  /** Emitted when the dialog is closed, with the button value and optional input value */
  close: [value: string, inputValue?: string]
}>()

// Generate unique IDs for accessibility
const dialogId = ref(`alert-dialog-${Math.random().toString(36).substr(2, 9)}`)
const titleId = computed(() => `${dialogId.value}-title`)
const messageId = computed(() => `${dialogId.value}-message`)

// Icon paths based on alert type
const iconPath = computed(() => {
  const icons: Record<AlertType, string> = {
    stop: '/assets/icons/system/alert-stop.png',
    caution: '/assets/icons/system/alert-caution.png',
    note: '/assets/icons/system/alert-note.png'
  }
  return icons[props.type]
})

// Input field state
const inputValue = ref(props.defaultValue)
const inputRef = ref<HTMLInputElement | null>(null)

// Alt text for icons
const iconAlt = computed(() => {
  const alts: Record<AlertType, string> = {
    stop: 'Stop',
    caution: 'Caution',
    note: 'Note'
  }
  return alts[props.type]
})

// Find the default button
const defaultButton = computed(() => {
  return props.buttons.find(b => b.isDefault) || props.buttons[0]
})

// Find the cancel button (for Escape key)
const cancelButton = computed(() => {
  return props.buttons.find(b => b.value === 'cancel') || props.buttons[0]
})

// Handle button click
function handleButtonClick(value: string): void {
  if (props.showInput) {
    emit('close', value, inputValue.value)
  } else {
    emit('close', value)
  }
}

// Handle overlay click
function handleOverlayClick(): void {
  if (props.dismissible) {
    if (props.showInput) {
      emit('close', cancelButton.value?.value || 'cancel', inputValue.value)
    } else {
      emit('close', cancelButton.value?.value || 'cancel')
    }
  }
}

// Handle dialog box click (prevent propagation)
function handleBoxClick(event: MouseEvent): void {
  event.stopPropagation()
}

// Handle keyboard events
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (props.showInput) {
      emit('close', defaultButton.value?.value || 'ok', inputValue.value)
    } else {
      emit('close', defaultButton.value?.value || 'ok')
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    if (props.showInput) {
      emit('close', cancelButton.value?.value || 'ok', inputValue.value)
    } else {
      emit('close', cancelButton.value?.value || 'ok')
    }
  }
}

// Focus management
const dialogRef = ref<HTMLElement | null>(null)

const { settings } = useSettings()
const { playSystemSound, playBeep } = useSound()

onMounted(() => {
  // Play alert sound
  if (settings.value.alertSound === 'beep') {
    playBeep()
  } else {
    playSystemSound(settings.value.alertSound)
  }

  // Focus the input if it exists, otherwise focus the dialog
  if (props.showInput && inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  } else {
    dialogRef.value?.focus()
  }
})
</script>

<template>
  <div
    class="alert-dialog"
    @keydown="handleKeydown"
  >
    <!-- Modal Overlay -->
    <div
      class="alert-dialog__overlay"
      @click="handleOverlayClick"
    />

    <!-- Dialog Box -->
    <div
      ref="dialogRef"
      class="alert-dialog__box"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="title ? titleId : undefined"
      :aria-describedby="messageId"
      tabindex="-1"
      @click="handleBoxClick"
    >
      <!-- Content Area -->
      <div class="alert-dialog__content">
        <!-- Icon -->
        <img
          data-testid="alert-icon"
          :src="iconPath"
          :alt="iconAlt"
          class="alert-dialog__icon"
        />

        <!-- Text Content -->
        <div class="alert-dialog__text">
          <!-- Title (optional) -->
          <h2
            v-if="title"
            :id="titleId"
            data-testid="alert-title"
            class="alert-dialog__title"
          >
            {{ title }}
          </h2>

          <!-- Message -->
          <p
            :id="messageId"
            data-testid="alert-message"
            class="alert-dialog__message"
          >
            {{ message }}
          </p>

          <!-- Input Field (Prompt) -->
          <div v-if="showInput" class="alert-dialog__input-container">
            <input
              ref="inputRef"
              v-model="inputValue"
              type="text"
              class="alert-dialog__input"
              :placeholder="inputPlaceholder"
              @click.stop
            />
          </div>
        </div>
      </div>

      <!-- Buttons -->
      <div class="alert-dialog__buttons">
        <button
          v-for="button in buttons"
          :key="button.value"
          class="alert-dialog__button mac-button"
          :class="{ 'alert-dialog__button--default mac-button--default': button.isDefault }"
          @click="handleButtonClick(button.value)"
        >
          {{ button.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-alert, 3000);
}

.alert-dialog__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.alert-dialog__box {
  position: relative;
  min-width: 300px;
  max-width: 450px;
  background-color: var(--color-window-bg, #CCCCCC);
  border: 2px solid var(--color-black, #000000);
  box-shadow: 2px 2px 0 var(--color-black, #000000);
  padding: var(--spacing-lg, 16px);
  outline: none;
}

.alert-dialog__content {
  display: flex;
  gap: var(--spacing-lg, 16px);
  margin-bottom: var(--spacing-lg, 16px);
}

.alert-dialog__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.alert-dialog__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 4px);
}

.alert-dialog__title {
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-md, 12px);
  font-weight: bold;
  margin: 0;
  color: var(--color-black, #000000);
}

.alert-dialog__message {
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-md, 12px);
  margin: 0;
  color: var(--color-black, #000000);
  line-height: var(--line-height-normal, 1.3);
}

.alert-dialog__buttons {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md, 8px);
}

.alert-dialog__button {
  min-width: 70px;
}

.alert-dialog__button--default {
  /* Default button styling is handled by mac-button--default class */
}

.alert-dialog__input-container {
  margin-top: var(--spacing-md, 8px);
}

.alert-dialog__input {
  width: 100%;
  padding: 2px 4px;
  font-family: var(--font-system, 'Chicago', 'Geneva', sans-serif);
  font-size: var(--font-size-md, 12px);
  border: 1px solid var(--color-black, #000000);
  background-color: var(--color-white, #FFFFFF);
  color: var(--color-black, #000000);
  outline: none;
}

.alert-dialog__input:focus {
  border-color: var(--color-highlight, #000080);
  box-shadow: 0 0 0 1px var(--color-highlight, #000080);
}
</style>
