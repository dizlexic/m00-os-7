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
  buttons: readonly AlertButton[]
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
    buttons?: readonly AlertButton[]
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

  /**
   * Shows a confirmation dialog
   */
  function showConfirm(message: string, title: string = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      showAlert({
        message,
        title,
        type: 'caution',
        buttons: [
          { label: 'Cancel', value: 'cancel' },
          { label: 'OK', value: 'ok', isDefault: true }
        ],
        onClose: (value) => {
          resolve(value === 'ok')
        }
      })
    })
  }

  return {
    alertState: readonly(state),
    showAlert,
    hideAlert,
    showConfirm
  }
}
