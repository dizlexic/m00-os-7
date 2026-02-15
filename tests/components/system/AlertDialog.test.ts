/**
 * AlertDialog Component Tests
 *
 * Tests for the Mac OS 7 style alert dialog component.
 * Following TDD methodology - these tests are written before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import AlertDialog from '~/components/system/AlertDialog.vue'

describe('AlertDialog.vue', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('rendering', () => {
    it('should render the alert dialog container', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.find('.alert-dialog').exists()).toBe(true)
    })

    it('should render modal overlay', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.find('.alert-dialog__overlay').exists()).toBe(true)
    })

    it('should render dialog box', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.find('.alert-dialog__box').exists()).toBe(true)
    })
  })

  describe('message display', () => {
    it('should display the message text', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'An error has occurred'
        }
      })
      expect(wrapper.text()).toContain('An error has occurred')
    })

    it('should have the message in a dedicated element', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const messageElement = wrapper.find('[data-testid="alert-message"]')
      expect(messageElement.exists()).toBe(true)
      expect(messageElement.text()).toBe('Test message')
    })

    it('should display optional title when provided', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          title: 'Warning'
        }
      })
      const titleElement = wrapper.find('[data-testid="alert-title"]')
      expect(titleElement.exists()).toBe(true)
      expect(titleElement.text()).toBe('Warning')
    })

    it('should not display title element when title is not provided', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const titleElement = wrapper.find('[data-testid="alert-title"]')
      expect(titleElement.exists()).toBe(false)
    })
  })

  describe('icon display', () => {
    it('should display stop icon when type is "stop"', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          type: 'stop'
        }
      })
      const icon = wrapper.find('[data-testid="alert-icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('src')).toContain('stop')
    })

    it('should display caution icon when type is "caution"', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          type: 'caution'
        }
      })
      const icon = wrapper.find('[data-testid="alert-icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('src')).toContain('caution')
    })

    it('should display note icon when type is "note"', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          type: 'note'
        }
      })
      const icon = wrapper.find('[data-testid="alert-icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('src')).toContain('note')
    })

    it('should default to note icon when type is not specified', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const icon = wrapper.find('[data-testid="alert-icon"]')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('src')).toContain('note')
    })

    it('should have appropriate alt text for the icon', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          type: 'stop'
        }
      })
      const icon = wrapper.find('[data-testid="alert-icon"]')
      expect(icon.attributes('alt')).toBeTruthy()
    })
  })

  describe('buttons', () => {
    it('should display OK button by default', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const buttons = wrapper.findAll('.alert-dialog__button')
      expect(buttons.length).toBe(1)
      expect(buttons[0].text()).toBe('OK')
    })

    it('should display custom buttons when provided', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          buttons: [
            { label: 'Cancel', value: 'cancel' },
            { label: 'Save', value: 'save' }
          ]
        }
      })
      const buttons = wrapper.findAll('.alert-dialog__button')
      expect(buttons.length).toBe(2)
      expect(buttons[0].text()).toBe('Cancel')
      expect(buttons[1].text()).toBe('Save')
    })

    it('should mark default button with special styling', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          buttons: [
            { label: 'Cancel', value: 'cancel' },
            { label: 'OK', value: 'ok', isDefault: true }
          ]
        }
      })
      const defaultButton = wrapper.find('.alert-dialog__button--default')
      expect(defaultButton.exists()).toBe(true)
      expect(defaultButton.text()).toBe('OK')
    })

    it('should emit "close" event with button value when clicked', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          buttons: [
            { label: 'Cancel', value: 'cancel' },
            { label: 'OK', value: 'ok' }
          ]
        }
      })
      const buttons = wrapper.findAll('.alert-dialog__button')
      await buttons[0].trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')![0]).toEqual(['cancel'])
    })

    it('should emit "close" event with "ok" when default OK button is clicked', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const button = wrapper.find('.alert-dialog__button')
      await button.trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')![0]).toEqual(['ok'])
    })
  })

  describe('keyboard shortcuts', () => {
    it('should close with default button value when Enter is pressed', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          buttons: [
            { label: 'Cancel', value: 'cancel' },
            { label: 'OK', value: 'ok', isDefault: true }
          ]
        },
        attachTo: document.body
      })
      
      await wrapper.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')![0]).toEqual(['ok'])
    })

    it('should close with "cancel" value when Escape is pressed', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          buttons: [
            { label: 'Cancel', value: 'cancel' },
            { label: 'OK', value: 'ok' }
          ]
        },
        attachTo: document.body
      })
      
      await wrapper.trigger('keydown', { key: 'Escape' })
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')![0]).toEqual(['cancel'])
    })

    it('should close with first button value when Escape is pressed and no cancel button', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        },
        attachTo: document.body
      })
      
      await wrapper.trigger('keydown', { key: 'Escape' })
      
      expect(wrapper.emitted('close')).toBeTruthy()
      expect(wrapper.emitted('close')![0]).toEqual(['ok'])
    })
  })

  describe('modal behavior', () => {
    it('should prevent clicks on overlay from closing by default', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      
      await wrapper.find('.alert-dialog__overlay').trigger('click')
      
      expect(wrapper.emitted('close')).toBeFalsy()
    })

    it('should close when clicking overlay if dismissible is true', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          dismissible: true
        }
      })
      
      await wrapper.find('.alert-dialog__overlay').trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not close when clicking dialog box', async () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          dismissible: true
        }
      })
      
      await wrapper.find('.alert-dialog__box').trigger('click')
      
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('props', () => {
    it('should accept message prop (required)', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.props('message')).toBe('Test message')
    })

    it('should accept type prop with default value "note"', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.props('type')).toBe('note')
    })

    it('should accept title prop', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          title: 'Alert Title'
        }
      })
      expect(wrapper.props('title')).toBe('Alert Title')
    })

    it('should accept buttons prop with default OK button', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.props('buttons')).toEqual([
        { label: 'OK', value: 'ok', isDefault: true }
      ])
    })

    it('should accept dismissible prop with default false', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      expect(wrapper.props('dismissible')).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have role="alertdialog"', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const dialog = wrapper.find('.alert-dialog__box')
      expect(dialog.attributes('role')).toBe('alertdialog')
    })

    it('should have aria-modal="true"', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const dialog = wrapper.find('.alert-dialog__box')
      expect(dialog.attributes('aria-modal')).toBe('true')
    })

    it('should have aria-labelledby pointing to title when title exists', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message',
          title: 'Alert Title'
        }
      })
      const dialog = wrapper.find('.alert-dialog__box')
      const titleId = wrapper.find('[data-testid="alert-title"]').attributes('id')
      expect(dialog.attributes('aria-labelledby')).toBe(titleId)
    })

    it('should have aria-describedby pointing to message', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        }
      })
      const dialog = wrapper.find('.alert-dialog__box')
      const messageId = wrapper.find('[data-testid="alert-message"]').attributes('id')
      expect(dialog.attributes('aria-describedby')).toBe(messageId)
    })

    it('should trap focus within the dialog', () => {
      wrapper = mount(AlertDialog, {
        props: {
          message: 'Test message'
        },
        attachTo: document.body
      })
      const dialog = wrapper.find('.alert-dialog__box')
      expect(dialog.attributes('tabindex')).toBe('-1')
    })
  })
})
