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
  onClose?: (value: string) => void
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
    onClose?: (value: string) => void
  }): void {
    state.value = {
      isVisible: true,
      message: options.message,
      title: options.title,
      type: options.type || 'note',
      buttons: options.buttons || [{ label: 'OK', value: 'ok', isDefault: true }],
      onClose: options.onClose
    }
  }

  /**
   * Hides the current alert dialog
   */
  function hideAlert(value: string = 'cancel'): void {
    const callback = state.value.onClose
    state.value.isVisible = false
    if (callback) {
      callback(value)
    }
  }

  return {
    alertState: readonly(state),
    showAlert,
    hideAlert
  }
}
