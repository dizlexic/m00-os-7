/**
 * useAlert Composable
 * 
 * Manages system-level alert dialogs.
 */

import { ref, readonly } from 'vue'
import type { AlertButton, AlertType } from '~/components/system/AlertDialog.vue'

interface AlertState {
  isVisible: boolean
  message: string
  title?: string
  type: AlertType
  buttons: AlertButton[]
  showInput?: boolean
  defaultValue?: string
  inputPlaceholder?: string
  onClose?: (value: string, inputValue?: string) => void
}

const state = ref<AlertState>({
  isVisible: false,
  message: '',
  type: 'note',
  buttons: []
})

export function useAlert() {
  /**
   * Shows an alert dialog
   */
  function showAlert(options: {
    message: string
    title?: string
    type?: AlertType
    buttons?: AlertButton[]
    showInput?: boolean
    defaultValue?: string
    inputPlaceholder?: string
    onClose?: (value: string, inputValue?: string) => void
  }): void {
    state.value = {
      isVisible: true,
      message: options.message,
      title: options.title,
      type: options.type || 'note',
      buttons: options.buttons || [{ label: 'OK', value: 'ok', isDefault: true }],
      showInput: options.showInput,
      defaultValue: options.defaultValue,
      inputPlaceholder: options.inputPlaceholder,
      onClose: options.onClose
    }
  }

  /**
   * Hides the current alert dialog
   */
  function hideAlert(value: string = 'cancel', inputValue?: string): void {
    const callback = state.value.onClose
    state.value.isVisible = false
    if (callback) {
      callback(value, inputValue)
    }
  }

  return {
    alertState: readonly(state),
    showAlert,
    hideAlert
  }
}
